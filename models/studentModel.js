import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  regNumber: { type: String, required: true, unique: true },
  classLevel: { type: String, required: true }, // e.g. JSS1, SS2
  branch: {
    type: String,
    enum: ['junior', 'science', 'arts', 'commerce'],
    default: 'junior'
  },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.model('Student', studentSchema);
