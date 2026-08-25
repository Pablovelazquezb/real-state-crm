const MeetingHistory = require('../../model/schema/meeting')
const mongoose = require('mongoose');

const add = async (req, res) => {
    try {
        const result = new MeetingHistory(req.body);
        await result.save();
        res.status(200).json(result);
    } catch (err) {
        console.error('Failed to create :', err);
        res.status(400).json({ err, error: 'Failed to create' });
    }
}

const supabase = require('../../db/supabaseClient');

const index = async (req, res) => {
    try {
        const { data: supuMeetings, error } = await supabase
            .from("meetings")
            .select("*")
            .eq("deleted", false);

        if (!error && supuMeetings) {
            const formatted = supuMeetings.map((m) => ({
                _id: m.id,
                agenda: m.agenda,
                location: m.location,
                startTime: m.start_time,
                endTime: m.end_time,
                notes: m.notes,
                createdDate: m.created_at,
                createBy: {
                    _id: m.created_by || "admin",
                    firstName: "Nova",
                    lastName: "Admin"
                }
            }));
            return res.status(200).send(formatted);
        }
    } catch (e) {
        console.log("Supabase meeting index error:", e.message);
    }

    try {
        return res.status(200).send([]);
    } catch (err) {
        return res.status(200).send([]);
    }
};

const view = async (req, res) => {
    try {
        let result = await MeetingHistory.findOne({ _id: req.params.id })
        if (!result) return res.status(404).json({ message: "no Data Found." })

        let response = await MeetingHistory.aggregate([
            { $match: { _id: result._id } },
            {
                $lookup: {
                    from: 'Contacts',
                    localField: 'attendes',
                    foreignField: '_id',
                    as: 'attendes'
                }
            },
            {
                $lookup: {
                    from: 'Leads',
                    localField: 'attendesLead',
                    foreignField: '_id',
                    as: 'attendesLead'
                }
            },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    // attendesArray: '$contact.email',
                    createdByName: '$users.username',
                }
            },
            {
                $project: {
                    // contact: 0,
                    users: 0
                }
            },
        ])

        res.status(200).json(response[0])
    } catch (err) {
        console.error('Failed :', err);
        res.status(400).json({ err, error: 'Failed ' });
    }
}

const deleteData = async (req, res) => {
    try {
        const meeting = await MeetingHistory.findByIdAndUpdate(req.params.id, { deleted: true });
        res.status(200).json({ message: "done", meeting: meeting })
    } catch (err) {
        res.status(404).json({ message: "error", err })
    }
}

const deleteMany = async (req, res) => {
    try {
        const meeting = await MeetingHistory.updateMany({ _id: { $in: req.body } }, { $set: { deleted: true } });
        res.status(200).json({ message: "done", meeting })
    } catch (err) {
        res.status(404).json({ message: "error", err })
    }
}

module.exports = { add, index, view, deleteData, deleteMany }