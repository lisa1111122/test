var express = require('express')
var router = express.Router()
//引入数据库连接
let conn = require('./db/conn')

//获取excel数据
router.get('/excel_data', (req, res) => {
  let sql = `select * from excela where 1=1`

  conn.query(sql, (err, data) => {
    if (err) throw err
    conn.query(sql, (err, data) => {
      if (err) throw err
      res.send({
        data,
      })
    })
  })
})

module.exports = router
