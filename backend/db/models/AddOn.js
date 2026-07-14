import mongoose from 'mongoose';

const addOnSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  icon:        { type: String, default: '' },
  title:       { type: String, required: true },
  price:       { type: String, required: true },
  category:    { type: String, enum: ['recurring', 'one-time'], default: 'recurring' },
  description: { type: String, default: '' },
  type:        { type: String, enum: ['chat', 'voice'], default: 'chat' },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

addOnSchema.index({ active: 1, id: 1 });

const AddOn = mongoose.model('AddOn', addOnSchema);
export default AddOn;
