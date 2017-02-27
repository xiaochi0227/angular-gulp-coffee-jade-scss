'use strict';
var gulp = require('gulp');
// gulp 插件加载集引用之后不需要在额外引用其他插件
var $ = require('gulp-load-plugins')();
// 打开标签页
var openURL = require('open');
// 分离多个pipe导流管道至一个工厂，即把多个stream链进行单独集合
var lazypipe = require('lazypipe');
// 顺序执行多个自己指定的task任务
var runSequence = require('run-sequence');
// 模块用于删除目录
var rimraf = require('rimraf')
// bower前端库引入进html
var wiredep = require('wiredep').stream;

// 定义目录
var yeoman = {
  app: require('./bower.json').appPath || 'app',
  tmp: '.tmp',
  dist: 'dist'
}

// 定义路径
// *.js匹配当前目录下的所有js文件,不指名扩展名则匹配所有类型
// */*.js匹配所有第一层子文件夹的js文件,第二层请用*/*/.js
// **/*.js匹配所有文件夹层次下的js文件, 包括当前目录
var paths = {
  jade: [yeoman.app + '/**/*.jade'],
  scripts: [yeoman.app + '/scripts/**/*.coffee'],
  styles: [yeoman.app + '/styles/**/*.scss'],
  views: {
    main: yeoman.tmp + '/index.html',
    files: [yeoman.tmp + '/views/**/*.html']
  }
}

// 对coffee进行风格检测并报告
var lintScripts = lazypipe()
  .pipe($.coffeelint)
  .pipe($.coffeelint.reporter);

/*

  sass
  编译scss为css自动加上浏览器前缀后放入.tmp/styles
  sass最终输出的样式包括下面几种样式风格：
  嵌套输出方式 nested
  展开输出方式 expanded 
  紧凑输出方式 compact 
  压缩输出方式 compressed
  autoprefixer
  ● last 2 versions: 主流浏览器的最新两个版本
  ● last 1 Chrome versions: 谷歌浏览器的最新版本
  ● last 2 Explorer versions: IE的最新两个版本
  ● last 3 Safari versions: 苹果浏览器最新三个版本
  ● Firefox >= 20: 火狐浏览器的版本大于或等于20
  ● iOS 7: IOS7版本
  ● Firefox ESR: 最新ESR版本的火狐
  ● > 5%: 全球统计有超过5%的使用率
*/
var styles = lazypipe()
  .pipe($.sass,{
    outputStyle: 'expanded', //样式输出方式：展开
    precision: 10 
  })
  .pipe($.autoprefixer, {
    browsers: ['last 2 versions'],
    cascade: true, //是否美化属性值 默认：true 像这样：
    //-webkit-transform: rotate(45deg);
    //        transform: rotate(45deg);
    remove:true //是否去掉不必要的前缀 默认：true 
  })
  .pipe(gulp.dest, yeoman.tmp + '/styles'); // 必须写成 gulp.dest, path 的格式。因为用了lazypipe()


// Tasks
// 获取原始路径编译为css加上浏览器前缀后放入目标目录
gulp.task('styles',function(){
  return gulp.src(paths.styles)
    .pipe(styles())
})

// 获取原始路径检查规范之后编译为js放入目标目录
gulp.task('coffee',function(){
  return gulp.src(paths.scripts)
    .pipe(lintScripts())
    .pipe($.coffee({bare: true}).on('error',$.util.log))
    .pipe(gulp.dest('.tmp/scripts'))
})

// 获取原始jade目录，编译为html后美化并放入目标目录
// prettify 美化 html
gulp.task('jade',function(){
  return gulp.src(paths.jade)
    .pipe($.jade())
    .pipe($.prettify({ indent_size: 2, unformatted: ['pre', 'code'] }))
    .pipe(gulp.dest(yeoman.tmp))
})

// 检查coffee规范
gulp.task('lint:scripts',function(){
  return gulp.src(paths.scripts)
    .pipe(lintScripts())
})

// 删除tmp目录
gulp.task('clean:tmp',function(cb){
  rimraf('./' + yeoman.tmp, cb)
})

// 执行创建端口 编译coffee jade styles 之后弹出窗口
gulp.task('start:client',['start:server','coffee','jade','styles'],function(){
  openURL('http://localhost:9001')
})
// 创建端口
gulp.task('start:server',function(){
  $.connect.server({
    root: [yeoman.app,yeoman.tmp],
    livereload: true,
    port: 9001
  })
})

// plumber 处理所有错误
gulp.task('watch',function(){
  $.watch(paths.styles)
    .on('change',function(_path){
      console.log("styles change at:",_path);
    })
    .pipe($.plumber())
    .pipe(styles())
    .pipe($.connect.reload())

  $.watch(paths.scripts)
    .on('change',function(_path){
      console.log("scripts change at:",_path);
    })
    .pipe($.plumber())
    .pipe(lintScripts())
    .pipe($.coffee({bare: true}).on('error',$.util.log))
    .pipe(gulp.dest(yeoman.tmp + '/scripts'))
    .pipe($.connect.reload())

  $.watch(paths.jade)
    .on('change',function(_path){
      console.log("jade change at:",_path);
    })
    .pipe($.plumber())
    .pipe($.jade())
    .pipe($.prettify({ indent_size: 2, unformatted: ['pre', 'code'] }))
    .pipe(gulp.dest(yeoman.tmp))
    .pipe($.connect.reload())

  $.watch('./bower.json',['bower'])
})

// bower前端库引入进html
gulp.task('bower',function(){
  return gulp.src(paths.views.main)
    .pipe(wiredep({
      directory: yeoman.app + '/bower_components',
      ignorePath: '..'
    }))
    .pipe(gulp.dest,yeoman.app)
})

// 依次执行 删除tmp目录 创建端口 编译各种 弹出窗口 添加watch监听
gulp.task('serve',function(cb){
  runSequence('clean:tmp',
    'start:client',
    'watch',
    cb
    )
})
// 编译生产环境 先gulp 然后跑这个任务
gulp.task('serve:prod',function(){
  $.connect.server({
    root: [yeoman.dist],
    livereload: true,
    port: 9001
  })
})

gulp.task('clean:dist',function(cb){
  rimraf('./dist',cb)
})


// build 压缩图片。去掉imagemin则直接进行copy
gulp.task('images',function(){
  return gulp.src(yeoman.app + '/images/**/*')
    .pipe($.cache($.imagemin({
      optimizationLevel: 5,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest(yeoman.dist + '/images'))
})

// copy 字体
gulp.task('copy:fonts',function(){
  return gulp.src([yeoman.app + '/fonts/**/*', yeoman.app + '/bower_components/bootstrap/fonts/**/*'])
    .pipe(gulp.dest(yeoman.dist + '/fonts'))
})

//copy html,js,css
gulp.task('html', ['jade','coffee','styles'] ,function () {
  return gulp.src([
      yeoman.tmp + '/**/*.html',
      '!' + yeoman.tmp + '/index.html',
      yeoman.app + '/**/*.html',
      yeoman.app + '/*.ico',yeoman.app + '/*.txt'
    ])
    .pipe(gulp.dest(yeoman.dist));
});

/*
  根据绝对路径搜索文件
  过滤js文件
  angularjs中简写代码不全
  压缩js
  过滤还原
  css过滤文件
  压缩css
  过滤还原
  放入目标目录
 */
gulp.task('client:build',['html'],function(){
  var jsFilter = $.filter('**/*.js')
  var cssFilter = $.filter('**/*.css')

  return gulp.src(paths.views.main)
    .pipe($.useref({searchPath: [yeoman.app,yeoman.tmp]}))
    .pipe(jsFilter)
    .pipe($.ngAnnotate())
    .pipe($.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.minifyCss({cache: true}))
    .pipe(cssFilter.restore())
    .pipe(gulp.dest(yeoman.dist))
})

gulp.task('build',['clean:tmp','clean:dist'],function(){
  runSequence(['images','copy:fonts','client:build'])
})

gulp.task('server',['serve'])
gulp.task('default',['build'])