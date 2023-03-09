const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    required: [true, "Please provide your Name"],
    type: String,
    trim: true,
    minlength: [1, "Name must have a minimum length of 1 character(s)!"],
    maxlength: [20, "Name must have a maximum length of 20 characters!"],
  },
  email: {
    type: String,
    lowercase: true,
    required: [true, "Please provide your Email"],
    trim: true,
    validator: [validator.isEmail, "Please provide a valid Email"],
  },
  photos: {
    type: String,
  },
  password: {
    type: String,
    minlength: [4, "Password must have a minimum length of 4 characters! "],
    maxlength: [62, "Password must have a maximum length of 62 characters! "],
    select: false,
    required: [true, "Please provide your Password"],
    trim: true,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
});

module.exports = mongoose.model("User", userSchema)