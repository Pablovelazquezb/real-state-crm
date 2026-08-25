const { Lead } = require("../../model/schema/lead");
const email = require("../../model/schema/email");
const PhoneCall = require("../../model/schema/phoneCall");
const Task = require("../../model/schema/task");
const MeetingHistory = require("../../model/schema/meeting");
const DocumentSchema = require("../../model/schema/document");

const supabase = require("../../db/supabaseClient");

const index = async (req, res) => {
  try {
    const { data: supuLeads, error } = await supabase
      .from("leads")
      .select("*")
      .eq("deleted", false);

    if (!error && supuLeads) {
      const formatted = supuLeads.map((l) => ({
        _id: l.id,
        leadName: l.lead_name,
        leadEmail: l.lead_email,
        leadPhoneNumber: l.lead_phone_number,
        leadAddress: l.lead_address,
        leadStatus: l.lead_status,
        leadSource: l.lead_source,
        createdDate: l.created_at,
        createBy: {
          _id: l.lead_owner || "admin",
          firstName: "Nova",
          lastName: "Admin"
        }
      }));
      return res.status(200).send(formatted);
    }
  } catch (e) {
    console.log("Supabase lead query error:", e.message);
  }

  try {
    const query = req.query;
    query.deleted = false;
    let allData = await Lead.find(query)
      .populate({
        path: "createBy",
        match: { deleted: false },
      })
      .exec();

    const result = (allData || []).filter((item) => item.createBy !== null);
    return res.send(result);
  } catch (mErr) {
    return res.send([]);
  }
};

const addMany = async (req, res) => {
  try {
    const data = req.body;
    const insertedLead = await Lead.insertMany(data);

    res.status(200).json(insertedLead);
  } catch (err) {
    console.error("Failed to create Lead :", err);
    res.status(400).json({ error: "Failed to create Lead" });
  }
};

const changeStatus = async (req, res) => {
  try {
    const { leadStatus } = req.body;
    let result = await Lead.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { leadStatus: leadStatus } },
      { new: true }
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    return res
      .status(200)
      .json({ message: "Status Change Successfully", result });
  } catch (err) {
    console.error("Failed to change status:", err);
    return res.status(400).json({ error: "Failed to change status : ", err });
  }
};

const add = async (req, res) => {
  try {
    req.body.createdDate = new Date();
    const user = new Lead(req.body);
    await user.save();
    res.status(200).json(user);
  } catch (err) {
    console.error("Failed to create Lead:", err);
    res.status(400).json({ error: "Failed to create Lead" });
  }
};

const edit = async (req, res) => {
  try {
    let result = await Lead.updateOne(
      { _id: req.params.id },
      { $set: req.body }
    );
    res.status(200).json(result);
  } catch (err) {
    console.error("Failed to Update Lead:", err);
    res.status(400).json({ error: "Failed to Update Lead" });
  }
};

const view = async (req, res) => {
  let lead = await Lead.findOne({ _id: req.params.id }).populate(
    "associatedListing"
  );

  if (!lead) return res.status(404).json({ message: "no Data Found." });

  let query = req.query;
  if (query.sender) {
    query.sender = new mongoose.Types.ObjectId(query.sender);
  }
  query.createByLead = req.params.id;

  let Email = await email.aggregate([
    { $match: { createByLead: lead._id } },
    {
      $lookup: {
        from: "Leads", // Assuming this is the collection name for 'leads'
        localField: "createByLead",
        foreignField: "_id",
        as: "createByrefLead",
      },
    },
    {
      $lookup: {
        from: "User",
        localField: "sender",
        foreignField: "_id",
        as: "users",
      },
    },
    { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$createByRef", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$createByrefLead", preserveNullAndEmptyArrays: true } },
    { $match: { "users.deleted": false } },
    {
      $addFields: {
        senderName: { $concat: ["$users.firstName", " ", "$users.lastName"] },
        deleted: {
          $cond: [
            { $eq: ["$createByRef.deleted", false] },
            "$createByRef.deleted",
            { $ifNull: ["$createByrefLead.deleted", false] },
          ],
        },
        createByName: {
          $cond: {
            if: "$createByRef",
            then: {
              $concat: [
                "$createByRef.title",
                " ",
                "$createByRef.firstName",
                " ",
                "$createByRef.lastName",
              ],
            },
            else: { $concat: ["$createByrefLead.leadName"] },
          },
        },
      },
    },
    {
      $project: {
        createByRef: 0,
        createByrefLead: 0,
        users: 0,
      },
    },
  ]);

  let phoneCall = await PhoneCall.aggregate([
    { $match: { createByLead: lead._id } },
    {
      $lookup: {
        from: "Leads", // Assuming this is the collection name for 'leads'
        localField: "createByLead",
        foreignField: "_id",
        as: "createByrefLead",
      },
    },

    {
      $lookup: {
        from: "User",
        localField: "sender",
        foreignField: "_id",
        as: "users",
      },
    },
    { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$createByrefLead", preserveNullAndEmptyArrays: true } },
    { $match: { "users.deleted": false } },
    {
      $addFields: {
        senderName: { $concat: ["$users.firstName", " ", "$users.lastName"] },
        deleted: "$createByrefLead.deleted",
        createByName: "$createByrefLead.leadName",
      },
    },
    { $project: { createByrefLead: 0, users: 0 } },
  ]);

  let task = await Task.aggregate([
    { $match: { assignToLead: lead._id } },
    {
      $lookup: {
        from: "Leads",
        localField: "assignToLead",
        foreignField: "_id",
        as: "lead",
      },
    },
    {
      $lookup: {
        from: "User",
        localField: "createBy",
        foreignField: "_id",
        as: "users",
      },
    },
    { $unwind: { path: "$lead", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        // assignToName: lead.leadName,
        assignToName: "$lead.leadName",
        createByName: "$users.username",
      },
    },
    { $project: { lead: 0, users: 0 } },
  ]);

  let meeting = await MeetingHistory.aggregate([
    {
      $match: {
        $expr: {
          $and: [{ $in: [lead._id, "$attendesLead"] }],
        },
      },
    },
    {
      $lookup: {
        from: "Leads",
        localField: "assignToLead",
        foreignField: "_id",
        as: "lead",
      },
    },
    {
      $lookup: {
        from: "User",
        localField: "createBy",
        foreignField: "_id",
        as: "users",
      },
    },
    { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        attendesArray: "$lead.leadEmail",
        createdByName: "$users.username",
      },
    },
    {
      $project: {
        users: 0,
      },
    },
  ]);
  const Document = await DocumentSchema.aggregate([
    { $unwind: "$file" },
    { $match: { "file.deleted": false, "file.linkLead": lead._id } },
    {
      $lookup: {
        from: "User", // Replace 'users' with the actual name of your users collection
        localField: "createBy",
        foreignField: "_id", // Assuming the 'createBy' field in DocumentSchema corresponds to '_id' in the 'users' collection
        as: "creatorInfo",
      },
    },
    { $unwind: { path: "$creatorInfo", preserveNullAndEmptyArrays: true } },
    { $match: { "creatorInfo.deleted": false } },
    {
      $group: {
        _id: "$_id", // Group by the document _id (folder's _id)
        folderName: { $first: "$folderName" }, // Get the folderName (assuming it's the same for all files in the folder)
        createByName: {
          $first: {
            $concat: ["$creatorInfo.firstName", " ", "$creatorInfo.lastName"],
          },
        },
        files: { $push: "$file" }, // Push the matching files back into an array
      },
    },
    { $project: { creatorInfo: 0 } },
  ]);

  res.status(200).json({ lead, Email, phoneCall, task, meeting, Document });
};

const deleteData = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { deleted: true });
    res.status(200).json({ message: "done", lead });
  } catch (err) {
    res.status(404).json({ message: "error", err });
  }
};

const deleteMany = async (req, res) => {
  try {
    const lead = await Lead.updateMany(
      { _id: { $in: req.body } },
      { $set: { deleted: true } }
    );
    res.status(200).json({ message: "done", lead });
  } catch (err) {
    res.status(404).json({ message: "error", err });
  }
};

module.exports = {
  index,
  add,
  addMany,
  view,
  edit,
  deleteData,
  deleteMany,
  changeStatus,
};
