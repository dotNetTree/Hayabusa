'use strict'

import gulp from 'gulp'
import util from 'gulp-util'
import connect from 'gulp-connect'

const DIR = {
  SRC: './app/',
  DEST: 'dist'
}

const SRC = {
  JS: DIR.SRC + 'js/*.js',
  HTML: DIR.SRC + '*.html'
}

gulp.task('connect', () => {
  connect.server({
    root: './app/',
    host: '0.0.0.0',
    open: { browser: 'Google Chrome' },
    livereload: true
  })
})

gulp.task('html', () => {
  gulp.src(SRC.HTML).pipe(connect.reload())
})

gulp.task('js', () => {
  gulp.src(SRC.JS).pipe(connect.reload())
})

gulp.task('watch', () => {
  gulp.watch(SRC.JS, ['js'])
  gulp.watch(SRC.HTML, ['html'])
})

gulp.task('default', ['connect', 'watch'])
