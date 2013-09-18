module.exports = (grunt) ->

  # Project configuration
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')

    # JavaScript related tasks
    coffee:
      compile:
        files:
          'build/js/app.js': 'app.coffee'

    concat:
      options:
        separator: ';'
      dist:
        src: [
          'components/bootstrap/assets/js/jquery.js',
          'components/bootstrap/dist/js/bootstrap.js',
          'components/moment/moment.js',
          'build/js/app.js'
        ]
        dest: 'build/js/<%= pkg.name %>.js'

    uglify:
      options:
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      dist:
        files:
          'static/js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']

    jshint:
      all: ['*.js']
      jshintrc: '.jshintrc'

    # CSS related tasks
    csslint:
      src: ['app.css']
      options:
        csslintrc: '.csslintrc'

    cssmin:
      combine:
        files:
          'static/css/16ate.css': ['components/bootstrap/dist/css/bootstrap.css', 'app.css']

    # Testing
    mochacov:
      all: ['test/*.coffee']
      options:
        reporter: 'spec'
        require: ['coffee-script']

    # Watch over me
    watch:
      cssmin:
        files: ['components/bootstrap/dist/css/bootstrap.css', 'app.css']
        tasks: ['cssmin']

    nodemon:
      dev:
        options:
          ignoredFiles: [
            'app.js',
            'build/**',
            'components/**',
            'node_modules/**'
          ]

    concurrent:
      target:
        tasks: ['nodemon', 'watch']
        options:
          logConcurrentOutput: true

  # Load the plugins
  require('matchdep').filterDev('grunt-*').forEach grunt.loadNpmTasks

  # Configure the tasks
  grunt.registerTask 'validate', ['jshint', 'csslint']
  grunt.registerTask 'build',    ['validate', 'coffee', 'concat', 'uglify', 'cssmin']
  grunt.registerTask 'test',     ['mochacov']
  grunt.registerTask 'server',   ['nodemon']
  grunt.registerTask 'default',  ['build', 'server']
