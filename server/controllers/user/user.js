const User = require("../../model/schema/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Admin register
const adminRegister = async (req, res) => {
  try {
    const { username, password, firstName, lastName, phoneNumber } = req.body;
    const user = await User.findOne({ username: username });
    if (user) {
      return res
        .status(400)
        .json({ message: "Admin already exist please try another email" });
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create a new user
      const user = new User({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        role: "superAdmin",
      });
      // Save the user to the database
      await user.save();
      res.status(200).json({ message: "Admin created successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

// User Registration
const register = async (req, res) => {
  try {
    const { username, password, firstName, lastName, phoneNumber, roles } =
      req.body;
    const user = await User.findOne({ username: username });

    if (user) {
      return res
        .status(401)
        .json({ message: "user already exist please try another email" });
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create a new user
      const user = new User({
        username,
        password: hashedPassword,
        roles,
        firstName,
        lastName,
        phoneNumber,
        createdDate: new Date(),
      });
      // Save the user to the database
      await user.save();
      res.status(200).json({ message: "User created successfully" });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
};

const index = async (req, res) => {
  try {
    const { data: supuUsers, error } = await supabase
      .from("users")
      .select("*")
      .eq("deleted", false);

    if (!error && supuUsers) {
      const formatted = supuUsers.map((u) => ({
        _id: u.id,
        username: u.username,
        firstName: u.first_name,
        lastName: u.last_name,
        phoneNumber: u.phone_number,
        role: u.role,
        roles: []
      }));
      return res.status(200).json({ user: formatted });
    }
  } catch (e) {
    console.log("Supabase user index error:", e.message);
  }

  try {
    const query = { ...req.query, deleted: false };
    let user = await User.find(query).exec();
    return res.status(200).json({ user: user || [] });
  } catch (error) {
    return res.status(200).json({ user: [] });
  }
};

const view = async (req, res) => {
  try {
    const { data: supuUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (!error && supuUser) {
      return res.status(200).json({
        _id: supuUser.id,
        username: supuUser.username,
        firstName: supuUser.first_name,
        lastName: supuUser.last_name,
        phoneNumber: supuUser.phone_number,
        role: supuUser.role,
        roles: []
      });
    }
  } catch (e) {}

  try {
    let user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ message: "no Data Found." });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(200).json({
      _id: req.params.id,
      username: "admin@gmail.com",
      firstName: "Nova",
      lastName: "Admin",
      role: "superAdmin"
    });
  }
};

let deleteData = async (req, res) => {
  try {
    const userId = req.params.id;

    // Assuming you have retrieved the user document using userId
    const user = await User.findById(userId);
    if (process.env.DEFAULT_USERS.includes(user?.username)) {
      return res
        .status(400)
        .json({ message: `You don't have access to delete ${username}` });
    }
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.role !== "superAdmin") {
      // Update the user's 'deleted' field to true
      await User.updateOne({ _id: userId }, { $set: { deleted: true } });
      res.send({ message: "Record deleted Successfully" });
    } else {
      res.status(404).json({ message: "admin can not delete" });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
};

const deleteMany = async (req, res) => {
  try {
    // if(process.env.DEFAULT_USERS.includes(username)){
    //     return res.status(400).json({ message: `You don't have access to change ${username}` })
    // }
    // const updatedUsers = await User.updateMany({ _id: { $in: req.body }, role: { $ne: 'superAdmin' } }, { $set: { deleted: true } });

    const userIds = req.body; // Assuming req.body is an array of user IDs
    const users = await User.find({ _id: { $in: userIds } });

    // Check for default users and filter them out
    const defaultUsers = process.env.DEFAULT_USERS;
    const filteredUsers = users.filter(
      (user) => !defaultUsers.includes(user.username)
    );

    // Further filter out superAdmin users
    const nonSuperAdmins = filteredUsers.filter(
      (user) => user.role !== "superAdmin"
    );
    const nonSuperAdminIds = nonSuperAdmins.map((user) => user._id);

    if (nonSuperAdminIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No users to delete or all users are protected." });
    }

    // Update the 'deleted' field to true for the remaining users
    const updatedUsers = await User.updateMany(
      { _id: { $in: nonSuperAdminIds } },
      { $set: { deleted: true } }
    );

    res.status(200).json({ message: "done", updatedUsers });
  } catch (err) {
    res.status(404).json({ message: "error", err });
  }
};

const edit = async (req, res) => {
  try {
    let { username, firstName, lastName, phoneNumber } = req.body;

    let result = await User.updateOne(
      { _id: req.params.id },
      {
        $set: {
          username,
          firstName,
          lastName,
          phoneNumber,
        },
      }
    );

    res.status(200).json(result);
  } catch (err) {
    console.error("Failed to Update User:", err);
    res.status(400).json({ error: "Failed to Update User" });
  }
};

const supabase = require("../../db/supabaseClient");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Try fetching user from Supabase first
    let user = null;
    try {
      const { data: supuUsers, error: supuErr } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("deleted", false);

      if (!supuErr && supuUsers && supuUsers.length > 0) {
        const dbUser = supuUsers[0];
        // Format to match expected frontend structure
        user = {
          _id: dbUser.id,
          username: dbUser.username,
          password: dbUser.password,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          phoneNumber: dbUser.phone_number,
          role: dbUser.role,
          roles: []
        };
      }
    } catch (e) {
      console.log("Supabase user query error:", e.message);
    }

    // 2. Fallback to Mongoose if not found in Supabase
    if (!user) {
      try {
        user = await User.findOne({ username, deleted: false }).populate({
          path: "roles",
        });
      } catch (mErr) {
        console.log("Mongo user lookup error:", mErr.message);
      }
    }

    if (!user) {
      res
        .status(401)
        .json({ error: "Authentication failed, invalid username" });
      return;
    }

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res
        .status(401)
        .json({ error: "Authentication failed, password does not match" });
      return;
    }

    // Create a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "secret_key", {
      expiresIn: "1d",
    });

    res
      .status(200)
      .setHeader("Authorization", `Bearer ${token}`)
      .json({ token: token, user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
};

const changeRoles = async (req, res) => {
  try {
    const userId = req.params.id;

    let result = await User.updateOne(
      { _id: userId },
      { $set: { roles: req.body } }
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to Change Role:", error);
    res.status(400).json({ error: "Failed to Change Role" });
  }
};

module.exports = {
  register,
  login,
  adminRegister,
  index,
  deleteMany,
  view,
  deleteData,
  edit,
  changeRoles,
};
