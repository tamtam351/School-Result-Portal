// models/subjectModel.js
import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branch: {
    type: String,
    enum: ['junior', 'science', 'arts', 'commerce'],
    required: true
  },
  classLevel: {
    type: String,
    enum: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // teacher assigned to this subject
  },
  isActive: {
    type: Boolean,
    default: true, // can be turned false if the teacher or subject is banned
  },
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);
