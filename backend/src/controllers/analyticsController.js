const Event = require('../models/Event');
const Club = require('../models/Club');
const Registration = require('../models/Registration');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * MongoDB Aggregation Pipelines matching Task 4 of the project spec:
 * 1. Revenue per Event & Club ($group + $lookup + $unwind + $project)
 * 2. Department Participation Metrics ($group + $sort)
 * 3. Turnout Rate Calculation (Total vs Checked-In)
 */
const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const [
    totalEvents,
    totalClubs,
    totalRegistrations,
    totalCheckedIn,
    seatTotals,
    revenueTotals,
    revenueAgg,
    departmentAgg,
    turnoutAgg
  ] = await Promise.all([
    Event.countDocuments(),
    Club.countDocuments(),
    Registration.countDocuments(),
    Registration.countDocuments({ checkInStatus: true }),
    Event.aggregate([
      { $group: { _id: null, totalSeatsAvailable: { $sum: '$seatsAvailable' } } }
    ]),
    Registration.aggregate([
      { $match: { 'paymentDetails.status': 'Completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$paymentDetails.amountPaid' } } }
    ]),
    // 1. Revenue per Event & Club
    Event.aggregate([
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'eventId',
          as: 'regs'
        }
      },
      {
        $project: {
          _id: 0,
          eventId: '$_id',
          eventCode: '$_id',
          eventTitle: '$title',
          organizerClub: '$organizerClub',
          totalTicketsSold: { $size: '$regs' },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$regs',
                    as: 'r',
                    cond: { $eq: ['$$r.paymentDetails.status', 'Completed'] }
                  }
                },
                as: 'paid',
                in: '$$paid.paymentDetails.amountPaid'
              }
            }
          }
        }
      },
      { $sort: { totalRevenue: -1, totalTicketsSold: -1 } }
    ]),
    // 2. Department Participation
    Registration.aggregate([
      {
        $group: {
          _id: '$department',
          totalRegistrations: { $sum: 1 },
          checkedInCount: {
            $sum: { $cond: [{ $eq: ['$checkInStatus', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          totalRegistrations: 1,
          checkedInCount: 1
        }
      },
      { $sort: { totalRegistrations: -1 } }
    ]),
    // 3. Turnout Rate by Event
    Event.aggregate([
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'eventId',
          as: 'regs'
        }
      },
      {
        $project: {
          _id: 0,
          eventId: '$_id',
          eventCode: '$_id',
          eventTitle: '$title',
          capacity: 1,
          seatsAvailable: 1,
          totalRegistrations: { $size: '$regs' },
          checkedInCount: {
            $size: {
              $filter: {
                input: '$regs',
                as: 'r',
                cond: { $eq: ['$$r.checkInStatus', true] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          turnoutPercentage: {
            $cond: [
              { $eq: ['$totalRegistrations', 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$checkedInCount', '$totalRegistrations'] },
                      100
                    ]
                  },
                  1
                ]
              }
            ]
          }
        }
      },
      { $sort: { turnoutPercentage: -1, totalRegistrations: -1 } }
    ])
  ]);

  res.json({
    success: true,
    summary: {
      totalEvents,
      totalClubs,
      totalRegistrations,
      totalCheckedIn,
      overallTurnoutRate:
        totalRegistrations > 0
          ? Number(((totalCheckedIn / totalRegistrations) * 100).toFixed(1))
          : 0,
      totalRevenue: revenueTotals[0]?.totalRevenue || 0,
      totalSeatsAvailable: seatTotals[0]?.totalSeatsAvailable || 0
    },
    revenueByEvent: revenueAgg,
    departmentParticipation: departmentAgg,
    turnoutByEvent: turnoutAgg
  });
});

module.exports = {
  getAnalyticsOverview
};
