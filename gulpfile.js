const
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    fs = require('fs'),
    remoteSrc = require('gulp-remote-src'),
    replace = require('gulp-replace'),
    fileinclude = require('gulp-file-include'),
    runSequence = require('run-sequence'),
    del = require('del'),
    shell = require('gulp-shell');

const
    // Place gitmodules URL here.
    gitModules = 'https://raw.githubusercontent.com/topjohnwu/Magisk/master/.gitmodules',
    // Get the repository information.
    repoInfoArray = gitModules.split('://')[1].split('/'),
    repoAuthor = repoInfoArray[1],
    repoName = repoInfoArray[2];

// Verbose logging
gutil.log('The author is ' + repoAuthor + ' and the repo is ' + repoName);

gulp.task('wipe', function () {
    return del([
        'wipe',
        'tmp',
        'Magisk'
    ]);
});

// Generate XML formatted .gitmodules file.
gulp.task('buildXml', function () {
    return remoteSrc(['.gitmodules'], {
            base: 'https://raw.githubusercontent.com/topjohnwu/Magisk/master/'
        })
        // .pipe(gulp.dest('folder'))
        .pipe(replace(/\[submodule /g, '<project name='))
        .pipe(replace(/\]/g, ''))
        .pipe(replace(/path = /g, 'path="'))
        .pipe(replace(/path="(.+)/g, '$&"'))
        .pipe(replace(/url = /g, 'url="'))
        .pipe(replace(/url="(.+)/g, '$&"'))
        .pipe(replace(/\r\n|\r|\n	/g, ' '))
        .pipe(replace(/\r\n|\r|\n/g, ' />\n'))
        .pipe(replace(/url="https:\/\/github.com\//g, 'remote="'))
        .pipe(replace(/remote=(.+)\w[\/]/g, "$& "))
        .pipe(replace(/\/ (.+") /g, "\""))
        .pipe(replace(/\/>/g, " revision=\"\"\/>"))
        .pipe(replace(/path="/g, "path=\"Magisk/"))
        .pipe(gulp.dest('tmp'));
});

gulp.task('cloneRepo', shell.task([
    // 'git clone https://github.com/topjohnwu/Magisk.git --recurse-submodules',
    'dir',
    'cd Magisk',
    'git submodule foreach \'git branch\'',
    'echo hi'
]))


gulp.task('submoduleSanitize', function () {
    // Generated results.txt in a Linux system with Clone Repo task commands.
    return gulp.src('results.txt')
        .pipe(replace(/Entering /g, ''))
        .pipe(replace(/\r\n\*|\r\*|\n\* /g, ''))
        .pipe(replace(/\(detached from .......\)/g, ''))
        .pipe(replace(/\' \r\n |\' \r |\' \n /g, ''))
        .pipe(replace(/'/g, ''))
        // .pipe(replace(/.* /g, ''))
        .pipe(gulp.dest('tmp'));
});

gulp.task('injectToOut', function () {
    return gulp.src('default.xml')
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@root'
        }))
        .pipe(gulp.dest('out'))
});

gulp.task('default', function (callback) {
    runSequence(
        'wipe',
        // 'cloneRepo',
        'submoduleSanitize',
        'buildXml',
        'injectToOut',
        callback);
});