const bcrypt = require('bcrypt-nodejs');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    email: { type: String, unique: true },
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    type_user: String
}, { timestamps: true });

userSchema.pre('save', function save(next) {
    const user = this;
    if (!user.isModified('password')) { return next(); }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) { return next(err); }
        bcrypt.hash(user.password, salt, null, (err, hash) => {
            if (err) { return next(err); }
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
    const user = this;
    return bcrypt.compareSync(candidatePassword, user.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;