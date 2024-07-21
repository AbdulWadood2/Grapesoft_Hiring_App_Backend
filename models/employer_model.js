const mongoose = require("mongoose");

const employerSchema = new mongoose.Schema(
  {
    avatar: { type: String, default: null },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },
    company_name: { type: String, required: true },
    password: {
      type: String,
      required: true,
    },
    refreshToken: [
      {
        type: String,
      },
    ],
    active:{
      type:Boolean,
      default:true
    }
  },
  {
    timestamps: true,
  }
);

const employer = mongoose.model("employer", employerSchema);
module.exports = employer;
