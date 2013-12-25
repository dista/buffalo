# 设备控制协议

## 概念


## 数据类型及名词解释

  * `byte`        1 byte
  * `short`       2 bytes
  * `bool`        1 byte, 0为否，1为是
  * `int`         4 bytes
  * `bytes`      n bytes
  * `string`      4 bytes长度字段 + string的实际数据
  * `device_id`   16 bytes 设备ID, byte 0设备的类型信息, byte 1-2为vendor编号，2-3为vendor设备型号编号, 剩下的为设备
                  实际ID

  第一个byte的含义如下表
  <table>
  <tr>
    <th>0</th>
    <th>1-6</th>
  </tr>
  <tr>
    <td>主/从, 0为主, 1为从</td>
    <td>设备子类型(红外控制器，灯光等等)</td>
  </tr>
  </table>
  * `remote_contoller_type` 1 byte 遥控器id, 0-20是特定类型遥控器， 20之后为自定义类型遥控器
  * `bit X` 从左往右来规定是哪个bit, bit X表示从左往右第X位, X从0开始
  * `remote_controller_id` 4 bytes, 手机修改，删除遥控器时需要向server提供的id, 这个ID在添加遥控器时由server返回


## 信息格式
所有请求格式都为
<table>
  <tr>
    <th>类型</th>
    <th>长度</th>
    <th>请求payload</th>
  </tr>
  <tr>
    <td>byte</td>
    <td>int</td>
    <td>bytes</td>
  </tr>
</table>
所有返回格式都为
<table>
  <tr>
    <th>类型</th>
    <th>是否成功</th>
    <th>长度</th>
    <th>返回payload</th>
  </tr>
  <tr>
    <td>byte</td>
    <td>bool</td>
    <td>int</td>
    <td>bytes</td>
  </tr>
</table>

## 失败返回payload
所有失败返回的格式都为
<table>
  <tr><th>失败码</th></tr>
  <tr><td>int</td></tr>
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
获取房间的设备信息，如果有红外控制器，并且为这个红外控制器创建了遥控器，也返回这些遥控器的信息
房间信息定义为

#### 请求payload为

<table>
  <tr>
    <th>房间ID</th>
  </tr>
  <tr>
    <td>int</td>
  </tr>
</table>

#### 返回payload为

<table>
  <tr>
    <th>房间ID</th>
    <th>房间名称</th>
    <th>设备信息</th>
  </tr>
  <tr>
    <td>int</td>
    <td>string</td>
    <td>bytes</td>
  </tr>
<table>
`设备信息`为设备数量(byte), 每个设备信息(bytes)
每个设备信息定义为
<table>
  <tr>
    <th>设备ID</th>
    <th>设备名称</th>
    <th>设备图片url</th>
    <th>设备属性</th>
  </tr>
  <tr>
    <td>devide_id</td>
    <td>string</td>
    <td>string</td>
    <td>short</td>
  </tr>
</table>

`设备属性` 设备属性在设备ID为不同时，含义不一样， 如果设备ID里说明是红外设备，那么bit 0表示是否有附属遥控设备

如果有遥控器，则后面跟遥控器的信息
遥控器的字段定义如下
<table>
   <tr>
       <th>遥控器数量</th>
       <th>遥控器信息</th>
   </tr>
   <tr>
        <td>byte</td>
        <td>bytes</td>
   </tr>
</table>
单个遥控器的字段定义如下
<table>
   <tr>
      <th>遥控器ID</th>
      <th>遥控器类型</th>
      <th>厂商</th>
      <th>型号</th>
      <th>遥控器属性</th>
   </tr>
   <tr>
      <td>remote_controller_id</td>
      <td>remote_controller_type</td>
      <td>string</td>
      <td>string</td>
      <td>short</td>
   </tr>
</table>

对于非自定义类型的遥控器，如果`遥控器属性`bit 0为1, 则接下去为学习信号的数量(byte), 学习信号的定义(bytes)
学习信号的定义的具体格式为
<table>
   <tr>
       <th>扩展键ID</th>
       <th>扩展键信号ID</th>
   </tr>
   <tr>
       <td>short</td>
       <td>int</td>
   </tr>
</table>
对于非自定义类型的遥控器，如果`遥控器属性`bit 1为1, 则接下去为扩展键的数量(byte), 扩展键的定义(bytes)
扩展键定义的具体格式为
<table>
   <tr>
       <th>扩展键ID</th>
       <th>扩展键名称</th>
       <th>扩展键信号ID</th>
   </tr>
   <tr>
       <td>int</td>
       <td>string</td>
       <td>int</td>
   </tr>
</table>

如果是自定义类型的遥控器，则当`遥控器属性`bit 0为1，则接下去为自定义类型遥控器的信息
自定义类型遥控器的信息包括: 键的个数(byte), 键的定义.
单个键的定义为
<table>
   <tr>
       <th>键ID</th>
       <th>键名称</th>
       <th>键离屏幕中心点x</th>
       <th>键离屏幕中心点y</th>
       <th>键类型</th>
       <th>键信号</th>
   </tr>
   <tr>
       <td>int</td>
       <td>string</td>
       <td>int</td>
       <td>int</td>
       <td>short</td>
       <td>int</td>
   </tr>
</table>
`键类型`的意思是：会有各种预定义的键，比如圆的，方的，各种大小的，每个都会有个类型标识

### 获取设备信息
可以获取如温度等信息，这些信息需要向设备查询
#### 请求payload为

<table>
  <tr>
    <th>设备ID</th>
  </tr>
  <tr>
    <td>device_id</td>
  </tr>
</table>

#### 返回payload为
各种设备返回的信息都不同，需要根据设备的类型进行解析
这个可以根据具体设备进行定义, 如果该设备为温度传感器，则返回
<table>
  <tr>
    <th>温度</th>
  </tr>
  <tr>
    <td>short</td>
  </tr>
</table>

### 控制设备
#### 请求payload为

<table>
  <tr>
    <th>设备ID</th>
    <th>控制信息</th>
  </tr>
  <tr>
    <td>device_id</td>
    <td>bytes</td>
  </tr>
</table>
`控制信息`是一个字符串，每种设备，它的定义都不相同

#### 返回payload为
除了头信息，不需要返回任何字段

### 添加设备

### 删除设备

