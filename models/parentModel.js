import mongoose from "mongoose";

const parentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String },
    password: { type: String, required: true },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // references Student users
      },
    ],
  },
  { timestamps: true }
);

const Parent = mongoose.model("Parent", parentSchema);
export default Parent;
