var express = require('express')
var router = express.Router()
//引入path模块

const moment = require('moment')

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
  }).unless({path: ['/article/list']})
)

//引入数据库连接
let conn = require('./db/conn')

/* 查询文章列表 */
router.get('/list', (req, res) => {
  let {pageSize, currentPage} = req.query

  if (!(pageSize && currentPage)) {
    res.send({code: 5001, msg: '缺少参数'})
    return
  }

  let sql = `select * from article `

  conn.query(sql, (err, data) => {
    if (err) throw err
    let total = data.length

    sql += ` order by ctime desc limit ${(currentPage - 1) * pageSize}, ${pageSize}`

    conn.query(sql, (err, data) => {
      if (err) throw err
      res.send({
        total,
        data,
      })
    })
  })
})

/* 添加文章 */
router.post('/add', (req, res) => {
  let {content, title} = req.body
  let {account} = req.auth

  if (!(content && title)) {
    res.send({code: 5001, msg: '缺少参数'})
    return
  }

  const ctime = moment().format('YYYY-MM-DD HH:mm:ss')
  const uptime = moment().format('YYYY-MM-DD HH:mm:ss')

  let sql = `insert into article (title,content,ctime,uptime,author) values("${title}","${content}","${ctime}","${uptime}","${account}")`

  conn.query(sql, (err, data) => {
    if (err) throw err
    //成功
    if (data.affectedRows > 0) {
      return res.send({
        code: 0,
        msg: '添加文章成功',
      })
    } else {
      return res.send({
        code: 1,
        msg: '添加失败',
      })
    }
  })
})

/* 修改文章 */
router.post('/edit', (req, res) => {
  let {content, id} = req.body

  if (!(id && content)) {
    res.send({code: 5001, msg: '缺少参数'})
    return
  }
  //base64转码
  // let b = new Buffer(content)
  // let c = b.toString('base64')

  const uptime = moment().format('YYYY-MM-DD HH:mm:ss')
  //?避免富文本 语法检查 防止注入 采用预编译模式
  const sql = `update article set content = ?, uptime = ?
   where id = ?`

  conn.query(sql, [content, uptime, id], (err, data) => {
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

/* 获取文章详情 */
router.get('/detail', (req, res) => {
  let {id} = req.query
  if (!id) {
    res.send({code: 5001, msg: '缺少参数'})
    return
  }
  let sql = `select * from article where id=${id}`

  conn.query(sql, (err, data) => {
    if (err) throw err
    if (data.length > 0) {
      // var b = new Buffer(data[0].content, 'base64')
      // let content = b.toString()

      // res.send({...data[0], content})
      res.send({...data[0]})
    }
  })
})

/* 删除文章 */
router.get('/del', (req, res) => {
  //get请求参数在query里面
  let {id} = req.query
  if (!id) {
    res.send({code: 5001, msg: '缺少参数'})
    return
  }

  const sql = `delete from article where id=${id}`
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
        msg: '没有此文章',
      })
    }
  })
})

module.exports = router
