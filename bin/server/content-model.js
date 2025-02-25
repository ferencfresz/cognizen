/*!
 * content-model
 *
 * ©Concurrent Technologies Corporation 2018
 */
var mongoose = require('mongoose'),
    extend = require('mongoose-schema-extend'),
    Schema = mongoose.Schema,
    Utils = require('./cognizen-utils');

Array.prototype.extend = function (otherArray) {
    if (otherArray instanceof Array) {
        otherArray.forEach(function(v) {this.push(v)}, this);
    }
}

var findByPath = function(mongooseType, item, callback) {
    mongooseType.findOne({path: item.path}, function (err, found) {
        if (found == null) {
            callback(false, item);
        }
        else {
            callback((err == null), found);
        }
    });
};

var createUnique = function (mongooseType, item, callback, additionalProperties) {
    findByPath(mongooseType, item, function(found, item) {
        if (!found) {
            var newInstance = null;
            if (additionalProperties != null) {
                newInstance = new mongooseType(additionalProperties);
            }
            else {
                newInstance = new mongooseType();
            }

            for (var prop in item) {
                newInstance[prop] = item[prop];
            }

            newInstance.save(function (err, savedData) {
                callback((err == null), savedData);
            });
        }
        else {
            callback(false, item);
        }
    });
};

var findProgram = function (program, callback) {
    Program.findById(program.id, function (err, found) {
        if (!err && found) {
            callback(found);
        }
        else {
            if (err) {
                console.log(err);
            }
            callback(null);
        }
    });
};

var findCourse = function (course, callback) {
    Course.findAndPopulate(course.id, function (err, found) {
        if (!err && found) {
            callback(found);
        }
        else {
            if (err) {
                console.log(err);
            }
            callback(null);
        }
    });
};

var allowCreationOfProgramContent = function(item, callback) {
    // Need to make sure that there are no courses with this name already.
    findByPath(Course, item, function(courseFound, course) {
        callback(!courseFound);
    });
};

var ContentSchema = new Schema({
    name: {type: String, required: true},
    path: {type: String, required: true}
});

var ProgramSchema = ContentSchema.extend({
    courses: [
        {type: Schema.Types.ObjectId, ref: 'Course'}
    ]
});

ProgramSchema.statics.findAndPopulate = function(id, callback) {
    Program.findById(id).exec(callback);
};

ProgramSchema.statics.createUnique = function (program, callback) {
    program.name = Utils.replaceInvalidFilenameChars(program.name); // Make sure there are no invalid characters in the program name, since it will be the git repo name.
    program.path = program.name;
    createUnique(Program, program, callback);
};

ProgramSchema.methods.getProgram = function() {
    return this;
};

ProgramSchema.methods.getChildren = function(callback) {
    Course.find({program: this}).populate('program').exec(function(err, courses) {
        var allChildren = [];
        allChildren.extend(courses);

        var count = 0;
        if (!courses.length) {
            callback(null, allChildren);
        }
        else {
            courses.forEach(function(course){
                course.getChildren(function(err, lessons) {
                    if (err) {
                        callback(err, []);
                    }
                    else {
                        count++;
                        allChildren.extend(lessons);
                        if(count == courses.length){
                            callback(null, allChildren);
                        }
                    }

                })
            });
        }
    });
};

ProgramSchema.methods.getParent = function() {
    return null;
};

ProgramSchema.methods.setParent = function(parent) {
    // NOOP
};

ProgramSchema.methods.toDashboardItem = function() {
    return {
        id: this.id,
        type: 'program',
        name: this.name,
        parentDir: '',
        path: this.name,
        permission: this.permission
    };;
};

ProgramSchema.methods.getRepoName = function() {
    return this.path.replace(' ', '_');
}

var ProjectSchema = ContentSchema.extend({
    program: {type: Schema.Types.ObjectId, ref: 'Program'}
});

var CourseSchema = ProjectSchema.extend({
    lessons: [
        {type: Schema.Types.ObjectId, ref: 'Lesson'}
    ]
});

CourseSchema.methods.getProgram = function() {
    return this.program;
};

CourseSchema.methods.getParent = function() {
    return this.program;
};

CourseSchema.methods.setParent = function(parent) {
    this.program = parent;
};

CourseSchema.methods.getChildren = function(callback) {
    Lesson.find({course: this}).populate('course').exec(function(err, lessons) {
        callback(err, lessons);
    });
};

CourseSchema.methods.generatePath = function() {
    this.path = [this.program.path, '/', Utils.replaceInvalidFilenameChars(this.name)].join('');
};

CourseSchema.methods.toDashboardItem = function() {
    return {
        id: this.id,
        type: 'course',
        name: this.name,
        parentDir: this.program.name,
        path: this.path,
        parent: this.program.id,
        permission: this.permission
    };
};

CourseSchema.statics.findAndPopulate = function(id, callback) {
    Course.findById(id).populate('program lessons').exec(callback);
};

CourseSchema.statics.createUnique = function (course, callback) {
    findProgram(course.program, function (program) {
        if (program) {
            course.program = program;
            course.path = [course.program.path, '/', Utils.replaceInvalidFilenameChars(course.name)].join('');
            // Make sure that we can create a course given the items path
            allowCreationOfProgramContent(course, function(allow) {
                if (allow) {
                    createUnique(Course, course, function (saved, data) {
                        if (saved) {
                            program.courses.push(data);
                            program.save(function (err) {
                                data.fullProgram = program;
                                callback(saved, data);
                            });
                        }
                        else {
                            callback(saved, data);
                        }
                    });
                }
                else {
                    callback(false, course);
                }
            });
        }
        else {
            console.log("Program with name '" + course.program.name + "' not found");
        }
    });
};

var LessonSchema = ContentSchema.extend({
    course: {type: Schema.Types.ObjectId, ref: 'Course'}
});
LessonSchema.statics.createUnique = function (lesson, callback) {
    findCourse(lesson.course, function (course) {
        if (course) {
            var courseProgram = course.program;
            lesson.course = course;
            lesson.path = [lesson.course.path, '/', Utils.replaceInvalidFilenameChars(lesson.name)].join('');
            createUnique(Lesson, lesson, function (saved, data) {
                if (saved) {
                    course.lessons.push(data);
                    course.save(function (err) {
                        data.fullProgram = courseProgram;
                        callback(saved, data);
                    });
                }
                else {
                    callback(saved, data);
                }
            });
        }
        else {
            console.log("Course with name '" + lesson.course.name + "' not found");
        }
    });
};

LessonSchema.methods.getProgram = function() {
    return this.course.program;
};

LessonSchema.methods.getParent = function() {
    return this.course;
};

LessonSchema.methods.setParent = function(parent) {
    this.course = parent;
};

LessonSchema.methods.getChildren = function(callback) {
    callback(null, []);
};

LessonSchema.methods.generatePath = function() {
    this.path = [this.course.path, '/', Utils.replaceInvalidFilenameChars(this.name)].join('');
};

LessonSchema.methods.toDashboardItem = function() {
    return {
        id: this.id,
        type: 'lesson',
        name: this.name,
        parentDir: this.course.name,
        path: this.path,
        parent: this.course.id,
        permission: this.permission
    };
};

LessonSchema.statics.findAndPopulate = function(id, callback) {
    Lesson.findById(id).populate('course').exec(function(err, foundLesson) {
        if (err || !foundLesson) {
            callback(err, foundLesson);
        }
        else {
            Course.findAndPopulate(foundLesson.course.id, function(err, foundCourse) {
                if (err || !foundLesson) {
                    callback(err, foundLesson);
                }
                else {
                    foundLesson.course = foundCourse;
                    callback(err, foundLesson);
                }
            });
        }
    });
};


var ContentCommentSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    contentType: { type: String, required: true},
    contentId: {type: String, required: true},
    pageId: {type: String, required: true},
    comment: {type: String, required: true},
    created: {type: Date, default: Date.now},
    status: {type: String, enum: ['new', 'inprogress', 'closed']}
});

var Content = mongoose.model('Content', ContentSchema);
var Program = mongoose.model('Program', ProgramSchema);
var Course = mongoose.model('Course', CourseSchema);
var Lesson = mongoose.model('Lesson', LessonSchema);
var ContentComment = mongoose.model('ContentComment', ContentCommentSchema);

module.exports = {
    Program: Program,
    Course: Course,
    Lesson: Lesson,
    ContentComment: ContentComment
}