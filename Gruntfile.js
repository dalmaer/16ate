module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
          'components/bootstrap/assets/js/jquery.js',
          'components/bootstrap/dist/js/bootstrap.js',
          'components/moment/moment.js',
          'app.js'
        ],
        dest: 'static/js/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'static/js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },

    jshint: {
      all: ['*.js'],
      jshintrc: '.jshintrc'
    },

    csslint: {
      src: ['app.css'],
      options: {
        csslintrc: '.csslintrc'
      }
    },

    cssmin: {
      combine: {
        files: {
          'static/css/16ate.css': ['components/bootstrap/dist/css/bootstrap.css', 'app.css']
        }
      }
    },

    watch: {
      cssmin: {
        files: ['components/bootstrap/dist/css/bootstrap.css', 'app.css'],
        tasks: ['cssmin']
      }
    },

    nodemon: {
      dev: {
        options: {
          ignoredFiles: [
            'app.js',
            'Gruntfile.js',
            'components/**',
            'node_modules/**'
          ]
        }
      }
    },

    concurrent: {
      target: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });

  // Load the plugins
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Default task(s).
  grunt.registerTask('validate', ['jshint', 'csslint']);
  grunt.registerTask('build', ['validate', 'concat', 'uglify', 'cssmin']);
  grunt.registerTask('server',  ['nodemon']);
  grunt.registerTask('default', ['build', 'server']);

};
