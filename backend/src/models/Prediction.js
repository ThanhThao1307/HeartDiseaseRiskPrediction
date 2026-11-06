import mongoose from 'mongoose'

const predictionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    features: { type: mongoose.Schema.Types.Mixed, required: true },
    model: { type: String, required: true, enum: ['all', 'random_forest', 'xgboost', 'ann'] },
    results: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
)

export default mongoose.model('Prediction', predictionSchema)