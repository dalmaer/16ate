module.exports = (grunt) ->

  # Project configuration
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')

    #
    # Scripting related tasks
    #

    # Take the main app entry point and the CoffeeScript library and output one app.js
    browserify:
      dist:
        files:
          'build/js/app.js': ['app.coffee', 'lib/*.coffee']
      options:
        transform: ['coffeeify']

    # Join the vendor libraries to the app.js to create one large JS
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

    # Minify and compress the concat output to create the final minified JS
    uglify:
      options:
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
        compress:
          dead_code: true
      dist:
        files:
          'static/js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']

    # CSS related tasks
    stylus:
      compile:
        files:
          'build/css/app.css': 'app.styl'

    cssmin:
      combine:
        files:
          'static/css/16ate.css': ['components/bootstrap/dist/css/bootstrap.css', 'build/css/app.css']

    # Testing
    mochacov:
      all: ['test/*.coffee']
      options:
        reporter: 'spec'
        require: ['coffee-script']

    # Watch over me
    watch:
      cssmin:
        files: ['components/bootstrap/dist/css/bootstrap.css', 'build/css/app.css']
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
  grunt.registerTask 'build',    ['browserify', 'concat', 'uglify', 'stylus', 'cssmin']
  grunt.registerTask 'test',     ['mochacov']
  grunt.registerTask 'server',   ['nodemon']
  grunt.registerTask 'default',  ['build', 'server']
