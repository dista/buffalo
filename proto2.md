# 控制协议

## 数据类型

  * `bool`        1 byte, 0为否，1为是
  * `int`         4 bytes
  * `string`      4 bytes长度字段 + string的实际数据
  * `device_id`   16 bytes 设备ID, 第一个字符为设备的类型信息, 2-16字符为实际ID
  第一个字符的含义如下表
  <table>
  <tr>
    <th>0</th>
    <th>1-6</th>
  </tr>
  <tr>
    <td>主/从, 0为主, 1为从</td>
    <td>设备子类型(红外，插座等等)</td>
  </tr>
  </table>


## 手机->服务器

### 获取手机的配置
<table>
  <tr>
    <th>震动</th>
    <th>声音</th>
  </tr>
  <tr>
    <td>bool</td>
    <td>bool</td>
  </tr>
</table>

### 获取房间信息

### 添加设备

### 删除设备




