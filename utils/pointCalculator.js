const { models } = require("mongoose");

function getTeachingPoints(credits, designation){
    if (Number(credits) != 3) return 0;

    const pointsByDesignation = {
        'Professor' : 2,
        'Assitant Professor' : 3,
        'Associate Professor' : 3
    };
    return pointsByDesignation[designation] || 0;
}

models.exports = {
    getTeachingPoints
};