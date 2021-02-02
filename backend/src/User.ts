// mongoose schema for user profiles
import mongoose from "mongoose";

const user = new mongoose.Schema(
  {
    username: {
      type: String,
      // forces element to be `unique` on db
      unique: true,
    },
    password: String,
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  // add `timestamp` outside of `req.body`
  { timestamps: true }
);

// model params: name of db collection and collection schema
export default mongoose.model("User", user);
