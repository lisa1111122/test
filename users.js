var express = require('express')
var router = express.Router()
//引入path模块
const path = require('path')

const moment = require('moment')

//引入数据库连接
let conn = require('./db/conn')

//引入multer 处理图片上传
let multer = require('multer')

/* 
  token鉴权
*/

//jsonwebtoken 用于生成token
const jwt = require('jsonwebtoken')
//express-jwt token解码工具
const {expressjwt} = require('express-jwt')
//secretKey 秘钥
const secretKey = 'xiaojumao'

//只要配置express-jwt这个中间件，就可以把解析出来的信息挂载在req.auth
// router.use(expressjwt({ secret: secretKey, algorithms: ['HS256'] }).unless({ path: [/^\/api\//] }))
router.use(
  expressjwt({
    secret: secretKey,
    algorithms: ['HS256'],
  }).unless({path: ['/user/login']})
)

/* 登录接口 */
router.post('/login', (req, res, next) => {
  //post请求 数据放在body里面
  let {account, password} = req.body
  //判断
  if (!account || !password) {
    res.send({code: 5001, msg: '缺少参数'})
  }

  //数据库查询 字符串必须加上引号
  const sql = `select * from users where account='${account}' && password=${password}`
  conn.query(sql, (err, data) => {
    if (err) throw err
    //判断查询结果是否为空
    if (data.length) {
      const userInfo = {...data[0]}
      //userInfo 加密内容  secretKey 加密秘钥 expiresIn token失效时间
      const token =
        'Bearer ' +
        jwt.sign(userInfo, secretKey, {
          //失效时间一周
          expiresIn: 60 * 60 * 24 * 7,
        })
      res.send({
        code: 0,
        msg: '欢迎您，登录成功',
        role: userInfo.role === '管理员' ? 'admin' : 'normal',
        token,
      })
    } else {
      res.send({
        code: 1,
        msg: '请输入正确的用户名密码',
      })
    }
  })
})

/* 添加用户 */
router.post('/add', (req, res) => {
  let {account, password, role} = req.body
  //缺少参数
  if (!(account && password && role)) {
    return res.send({code: 5001, msg: '缺少参数'})
  }

  //处理数据
  const ctime = moment().format('YYYY-MM-DD HH:mm:ss')
  //sql添加
  const sql = `insert into users(account,password,role,ctime,avatar) values("${account}","${password}","${role}","${ctime}","default.jpg")`
  //操作数据库
  conn.query(sql, (err, data) => {
    if (err) throw err
    //成功
    if (data.affectedRows > 0) {
      return res.send({
        code: 0,
        msg: '添加用户成功',
      })
    } else {
      return res.send({
        code: 1,
        msg: '添加失败',
      })
    }
  })
})

/* 删除用户 */
router.get('/del', (req, res) => {
  //get请求参数在query里面
  let {id} = req.query
  if (!id) {
    res.send({code: 5001, msg: '缺少参数'})
    return
  }

  const sql = `delete from users where id=${id}`
  conn.query(sql, (err, data) => {
    if (err) throw err
    if (data.affectedRows > 0) {
      res.send({
        code: 0,
        msg: '删除成功',
      })
    } else {
      return res.send({
        code: 1,
        msg: '没有此用户',
      })
    }
  })
})

/* 删除多个用户 */
router.get('/batchdel', (req, res) => {
  //get请求参数在query里面
  let {ids} = req.query
  if (!ids) {
    res.send({code: 5001, msg: '缺少参数'})
    return
  }

  const sql = `delete from users where id in (${JSON.parse(ids).join(',')})`
  conn.query(sql, (err, data) => {
    if (err) throw err
    if (data.affectedRows > 0) {
      res.send({
        code: 0,
        msg: '删除成功',
      })
    } else {
      return res.send({
        code: 1,
        msg: '没有此用户',
      })
    }
  })
})

/* 修改用户 */
router.post('/edit', (req, res) => {
  let {account, role, id} = req.body

  if (!(id && account && role)) {
    res.send({code: 5001, msg: '缺少参数'})
    return
  }

  const sql = `update users set account="${account}",role="${role}"
   where id = ${id}`

  conn.query(sql, (err, data) => {
    if (err) throw err
    if (data.affectedRows > 0) {
      res.send({
        code: 0,
        msg: '修改成功',
      })
    } else {
      return res.send({
        code: 1,
        msg: '修改失败',
      })
    }
  })
})

/* 查询用户 */
router.get('/list', (req, res) => {
  let {pageSize, currentPage, account, ctime} = req.query
  if (!(pageSize && currentPage)) {
    res.send({code: 5001, msg: '缺少参数'})
    return
  }

  let sql = `select * from users where 1=1`

  if (account) {
    sql += ` and account like "%${account}%"`
  }

  ctime = ctime || '[]'
  ctime = Array.isArray(ctime) ? [] : JSON.parse(ctime)

  // ctime = ['2022-09-01 00:00:00', '2022-10-10 00:00:00']
  if (ctime.length) {
    sql += ` and ctime between "${ctime[0]}" and "${ctime[1]}"`
  }

  conn.query(sql, (err, data) => {
    if (err) throw err
    //总页数
    let total = data.length
    //创建时间倒序
    sql += ` order by ctime desc limit ${(currentPage - 1) * pageSize}, ${pageSize}`
    conn.query(sql, (err, data) => {
      if (err) throw err
      res.send({
        data,
        total,
      })
    })
  })
})

/* 用户头像上传 */
const storage = multer.diskStorage({
  destination: 'public/upload/imgs',
  filename: (req, file, cb) => {
    //获取后缀
    let extName = path.extname(file.originalname)
    //用时间戳做名称
    let filename = Math.floor(new Date().getTime() / 1000)
    cb(null, filename + extName)
  },
})

//创建multer配置
let upload = multer({
  storage,
})

//upload.single('form-data的参数名') 单图上传 多图用upload.array
router.post('/avatar_upload', upload.single('file'), (req, res) => {
  //获取上传文件名
  let {filename} = req.file
  res.send({
    code: 0,
    msg: '上传头像成功',
    avatar: '/upload/imgs/' + filename,
  })
})

/* 修改用户头像 */
router.get('/avatar_edit', (req, res) => {
  let {avatar} = req.query
  //req.auth里面可以解析出 token的信息
  let {id} = req.auth

  if (!avatar) {
    res.send({code: 5001, msg: '缺少参数'})
    return
  }

  const sql = `update users set avatar="${avatar}" where id=${id}`

  conn.query(sql, (err, data) => {
    if (err) throw err
    if (data.affectedRows > 0) {
      res.send({
        code: 0,
        msg: '修改成功',
      })
    } else {
      return res.send({
        code: 1,
        msg: '修改失败',
      })
    }
  })
})

/* 获取用户信息 */
router.get('/info', (req, res) => {
  //req.auth里面可以解析出 token的信息
  let {id} = req.auth
  let sql = `select id,account,role,avatar,ctime from users where id=${id}`
  conn.query(sql, (err, data) => {
    if (err) throw err

    //超级管理员路由表
    let superMenu = [
      /* 用户管理 */
      {
        path: '/account',
        component: 'Layout',
        redirect: '/account/list',
        meta: {title: '用户管理', path: '/account', icon: 'user'},
        children: [
          {
            meta: {title: '用户列表', path: '/account/list', roles: ['super']},
            path: '/account/list',
            component: '/account/account-list',
          },
          {
            meta: {title: '添加用户', path: '/account/add', roles: ['super']},
            path: '/account/add',
            component: '/account/account-add',
          },
          {
            meta: {title: '个人中心', path: '/account/person'},
            path: '/account/person',
            component: '/account/person',
          },
        ],
      },
      /* 文章中心 */
      {
        path: '/article',
        component: 'Layout',
        redirect: '/article/list',
        meta: {title: '文章管理', path: '/article', icon: 'phone'},
        children: [
          {
            path: '',
            component: '/article/list',
          },
          {
            path: '/article/edit',
            component: '/article/edit',
            hidden: true,
          },
        ],
      },
      /* excel */

      {
        path: '/excel',
        component: 'Layout',
        redirect: '/excel/excel-export',
        meta: {title: 'excel管理', path: '/excel', roles: ['super'], icon: 'manage'},
        children: [
          {
            path: '/excel/excel-export',
            meta: {title: 'excel导出', path: '/excel/excel-export'},
            component: '/excel/excel-export',
          },
          {
            path: '/excel/excel-import',
            meta: {title: 'excel导入', path: '/excel/excel-import'},
            component: '/excel/excel-import',
          },
        ],
      },
      /* 匹配错误地址 */
      {
        path: '/:pathMatch(.*)',
        redirect: '/404',
        hidden: true,
      },
    ]

    //普通管理员路由表
    let normalMenu = [
      /* 用户管理 */
      {
        path: '/account',
        component: 'Layout',
        redirect: '/account/list',
        meta: {title: '用户管理', path: '/account', icon: 'user'},
        children: [
          {
            meta: {title: '个人中心', path: '/account/person'},
            path: '/account/person',
            component: '/account/person',
          },
        ],
      },

      /* 匹配错误地址 */
      {
        path: '/:pathMatch(.*)',
        redirect: '/404',
        hidden: true,
      },
    ]

    if (data.length) {
      data[0].avatar = 'http://127.0.0.1:5000/upload/imgs/' + data[0].avatar
      //修改数据 根据不同角色 返回不同的路由表
      if (data[0].role === 'admin') {
        data[0].menu = superMenu
      } else {
        data[0].menu = normalMenu
      }

      res.send({userInfo: data[0]})
    }
  })
})

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource')
})

module.exports = router
