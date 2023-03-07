import mongoose from 'mongoose'

const ReportSchema = new mongoose.Schema({
    reporter: String,
    uid: String,
    reason: { type: String, minLength: 2, maxLength: 50 },
    username: String,
    evidence: { type: String, minLength: 2, maxLength: 100 },
    description: { type: String, minLength: 2, maxLength: 250 },
    solved: Boolean,
    date: Date,
})

export default mongoose.model('Report', ReportSchema)
