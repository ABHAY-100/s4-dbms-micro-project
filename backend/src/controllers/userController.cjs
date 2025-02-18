const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const disposableEmailDomains = require('disposable-email-domains');

const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { email, password, name, role, phone, status } = req.body;

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const phoneRegex = /^\+91[7-9][0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number format." });
    }

    const emailDomain = email.split('@')[1];

    if (disposableEmailDomains.includes(emailDomain)) {
      return res.status(400).json({ error: "Temporary email addresses are not allowed" });
    }

    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const existingUserByPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingUserByPhone) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        phone,
        status
      },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.cookie("death_set_auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userDetails = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      status: user.status,
    }

    res.status(201).json({ message: "User registered successfully", userDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.cookie("death_set_auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userDetails  = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      status: user.status,
    }

    res.json({ message: "User logged in successfully", userDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  const userResponse = {
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    status: req.user.status,
    phone: req.user.phone,
  };

  res.json({ user: userResponse });
};

const updateUser = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "password", "role", "phone"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: "Invalid updates" });
    }

    if (req.body.phone) {
      const phoneRegex = /^\+91[7-9][0-9]{9}$/;
      if (!phoneRegex.test(req.body.phone)) {
        return res.status(400).json({ error: "Invalid phone number format." });
      }

      const existingUserByPhone = await prisma.user.findUnique({ 
        where: { phone: req.body.phone } 
      });
      if (existingUserByPhone) {
        return res.status(400).json({ error: "Phone number already exists" });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...req.body,
        password: req.body.password
          ? await bcrypt.hash(req.body.password, 10)
          : undefined,
      },
    });

    const userDetails = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      status: user.status,
    }

    res.json({ message: "User updated successfully", userDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ["STAFF"],
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        _count: {
          select: {
            records: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const updatedUser = await prisma.user.update({
      where: { email: req.query.email },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    res.json({ message: "Staff status updated successfully", user: updatedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("death_set_auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateUser,
  getAllStaff,
  updateUserStatus
};
