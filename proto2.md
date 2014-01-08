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
  * `time_BCD`    时间的BCD表示2014-02-11 00:23:12 需要用7个bytes表示，byte 1 0x20, byte 2 0x14
                  byte 3 0x02, byte 4 0x11, byte 5 0x00, byte 6 0x23, byte 7 0x12
  * `ip`          四个字节，比如202.112.12.13 则表示为 0xCA 0x70 0x0c 0x0d

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
  * `remote_contoller_type` short 如果是0,则是自定义遥控器,否则为特定型号的遥控器
  * `bit X` 从左往右来规定是哪个bit, bit X表示从左往右第X位, X从0开始
  

各种整形以`big-endian`进行编码


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

可能的错误码有
<table>
  <tr>
    <th>错误码</th>
    <th>含义</th>
  </tr>
  <tr>
    <td>0x01</td>
    <td>不存在</td>
  </tr>
  <tr>
    <td>0x02</td>
    <td>超时</td>
  </tr>
  <tr>
    <td>0x03</td>
    <td>Server内部错误</td>
  </tr>
  <tr>
    <td>0x04</td>
    <td>已经被占用</td>
  </tr>
</table>

## 手机->服务器

### 获取手机的配置(0x80)
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

### 修改房间信息(0x81)
#### 请求payload为

<table>
  <tr>
    <th>房间ID</th>
    <th>房间名称</th>
  </tr>
  <tr>
    <td>int</td>
    <td>string</td>
  </tr>
</table>

#### 返回payload为
空


### 获取房间信息(0x82)
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
      <th>遥控器属性</th>
   </tr>
   <tr>
      <td>byte</td>
      <td>remote_controller_type</td>
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

### 获取设备信息(0x83)
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
各种设备返回的信息都不同，具体见下面设备返回

### 控制设备(0x84)
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
下面定义下这个项目会用到的控制指令
1. 锁定设备(0x01)
<table>
    <tr>
    <th>控制命令</th>
    <th>是否锁定</th>
  </tr>
  <tr>
    <td>short</td>
    <td>byte</td>
  </tr>
</table>
2. 组合控制命令(0x02)
<table>
  <tr>
    <th>控制命令</th>
    <th>组数</th>
    <th>单个命令</th>
  </tr>
  <tr>
    <td>short</td>
    <td>byte</td>
    <td>bytes</td>
  </tr>
</table>

`单个命令`的定义为
<table>
  <tr>
    <th>控制命令</th>
    <th>控制命令参数长度</th>
    <th>控制命令参数</th>
    <th>额外参数长度</th>
    <th>额外参数</th>
  </tr>
   <tr>
    <td>short</td>
    <td>int</td>
    <td>bytes</td>
    <td>int</td>
    <td>bytes</td>
  </tr>
</table>

#### 返回payload为
空

### 添加遥控器(0x85)
#### 请求payload为
<table>
  <tr>
    <th>设备标识</th>
    <th>遥控器id</th>
    <th>遥控器类型</th>
  </tr>
  <tr>
    <td>int</td>
    <td>byte</td>
    <td>remote_contoller_type</td>
  </tr>
</table>
#### 返回payload为
空

### 删除遥控器(0x86)
#### 请求payload为
<table>
  <tr>
    <th>设备标识</th>
    <th>遥控器id</th>
  </tr>
  <tr>
    <td>int</td>
    <td>byte</td>
  </tr>
</table>
#### 返回payload为
空

### 为特定类型遥控器添加自定义按键(0x87)
#### 请求payload为
<table>
  <tr>
    <th>设备标识</th>
    <th>遥控器id</th>
    <th>按键id</th>
    <th>名称</th>
  </tr>
  <tr>
    <td>int</td>
    <td>byte</td>
    <td>short</td>
    <td>string</td>
  </tr>
</table>
#### 返回payload为
空

### 为自定义类型遥控器添加自定义按键(0x88)
#### 请求payload为
<table>
  <tr>
    <th>设备标识</th>
    <th>遥控器id</th>
    <th>按键id</th>
    <th>名称</th>
    <th>键离屏幕中心点x</th>
    <th>键离屏幕中心点y</th>
    <th>键类型</th>
  </tr>
  <tr>
    <td>int</td>
    <td>byte</td>
    <td>short</td>
    <td>string</td>
    <td>int</td>
    <td>int</td>
    <td>short</td>
  </tr>
</table>
#### 返回payload为
空

### 为特定类型遥控器修改自定义按键(0x89)
#### 请求payload为
<table>
  <tr>
    <th>设备标识</th>
    <th>遥控器id</th>
    <th>按键id</th>
    <th>名称</th>
  </tr>
  <tr>
    <td>int</td>
    <td>byte</td>
    <td>short</td>
    <td>string</td>
  </tr>
</table>
#### 返回payload为
空

### 为自定义类型遥控器修改自定义按键(0x8a)
#### 请求payload为
<table>
  <tr>
    <th>设备标识</th>
    <th>遥控器id</th>
    <th>按键id</th>
    <th>名称</th>
    <th>键离屏幕中心点x</th>
    <th>键离屏幕中心点y</th>
    <th>键类型</th>
  </tr>
  <tr>
    <td>int</td>
    <td>byte</td>
    <td>short</td>
    <td>string</td>
    <td>int</td>
    <td>int</td>
    <td>short</td>
  </tr>
</table>
#### 返回payload为
空

### 遥控器删除自定义按键(0x8b)
#### 请求payload为
<table>
  <tr>
    <th>设备标识</th>
    <th>遥控器id</th>
    <th>按键id</th>
  </tr>
  <tr>
    <td>int</td>
    <td>byte</td>
    <td>short</td>
  </tr>
</table>
#### 返回payload为
空
    
### 关联设备(0x8c)
#### 请求payload为

<table>
  <tr>
    <th>设备ID</th>
    <th>主设备ID</th>
    <th>时区</th>
  </tr>
  <tr>
    <td>device_id</td>
    <td>device_id/none</td>
    <td>byte, 最高为bit为正负，剩余bits为时区值</td>
  </tr>
</table>

如果该设备是主设备,则主设备ID不需要填写; 如果是从设备,则主设备ID必须填写

#### 返回payload为
空

### 解除关联设备(0x8d)
#### 请求payload为

<table>
  <tr>
    <th>设备标识</th>
  </tr>
  <tr>
    <td>device_id</td>
  </tr>
</table>

#### 返回payload为
空

### 修改设备(0x8e)
#### 请求payload为
<table>
  <tr>
    <th>设备标识</th>
    <th>设备名称</th>
    <th>设备图片ID</th>
  </tr>
  <tr>
    <td>int</td>
    <td>string</td>
    <td>int</td>
  </tr>
</table>

#### 返回payload为
空

### 控制设备(0x8f)
<table>
  <tr>
    <th>设备标识</th>
    <th>控制指令</th>
  </tr>
  <tr>
    <td>int</td>
    <td>bytes</td>
  </tr>
</table>

`控制指令`的第一个字符为子控制指令标识, 剩余数据为控制指令本身

1. 学习按键的`控制指令`(0x10)
<table>
  <tr>
    <th>遥控器id</th>
    <th>按键id</th>
  </tr>
  <tr>
    <td>byte</td>
    <td>int</td>
  </tr>
</table>

2. 发送红外指令(0x11)
<table>
  <tr>
    <th>红外信号的标识</th>
  </tr>
  <tr>
    <td>int</td>
  </tr>
</table>

3. 删除按键红外信号(0x12)
<table>
  <tr>
    <th>遥控器id</th>
    <th>按键id</th>
  </tr>
  <tr>
    <td>byte</td>
    <td>int</td>
  </tr>
</table>


#### 返回payload为
1. 学习按键的返回
<table>
  <tr>
    <th>红外信号的标识</th>
  </tr>
  <tr>
    <td>int</td>
  </tr>
</table>
2. 空

3. 空


### 注册用户(0x90)
#### 请求payload为
<table>
  <tr>
    <th>email</th>
    <th>密码</th>
  </tr>
  <tr>
    <td>string</td>
    <td>string</td>
  </tr>
</table>
#### 返回payload为
空

## 修改密码(0x91)
#### 请求payload为
<table>
  <tr>
    <th>email</th>
    <th>原密码</th>
    <th>新密码</th>
  </tr>
  <tr>
    <td>string</td>
    <td>string</td>
    <td>string</td>
  </tr>
</table>
#### 返回payload为
空

## 找回密码(0x91)
#### 请求payload为
<table>
  <tr>
    <th>email</th>
  </tr>
  <tr>
    <td>string</td>
  </tr>
</table>
#### 返回payload为
空

## 用户登录(0x92)
#### 请求payload为
<table>
  <tr>
    <th>email</th>
    <th>密码</th>
  </tr>
  <tr>
    <td>string</td>
    <td>string</td>
  </tr>
</table>
#### 返回payload为
<table>
  <tr>
    <th>是否改IP</th>
    <th>ip地址</th>
    <th>设备数量</th>
    <th>单个设备状态描述</th>
  </tr>
  <tr>
    <td>bool</td>
    <td>ip/none</td>
    <td>int</td>
    <td>bytes</td>
  </tr>
</table>

`单个设备状态描述`的定义为
<table>
  <tr>
    <th>设备ID</th>
    <th>设备状态长度</th>
    <th>设备状态</th>
  </tr>
  <tr>
    <td>device_id</td>
    <td>int</td>
    <td>bytes</td>
  </tr>
</table>
`设备状态` 在红外项目里面的定义为
<table>
  <tr>
    <th>温度</th>
    <th>是否锁定</th>
  </tr>
  <tr>
    <td>short</td>
    <td>bool</td>
  </tr>
</table>

### 用户退出(0x93)
#### 请求payload为
空
#### 返回payload为
空

### 检查邮箱(0x94)
#### 请求payload为
<table>
  <tr>
    <th>email</th>
  </tr>
  <tr>
    <td>string</td>
  </tr>
</table>
#### 返回payload为
空

## 设备->服务器

### 设备登录(0xa0)
#### 请求payload为
<table>
  <tr>
    <th>设备id</th>
  </tr>
  <tr>
    <td>device_id</td>
  </tr>
</table>
#### 返回payload为
<table>
  <tr>
    <th>时间</th>
    <th>星期数</th>
    <th>更换IP</th>
    <th>ip地址</th>
  </tr>
  <tr>
    <td>time_BCD</td>
    <td>byte [1,7]</td>
    <td>bool</td>
    <td>ip, 更换ip为true时存在</td>
  </tr>
</table>

### 设备心跳(0xa1)
#### 请求payload为
空
#### 返回payload为
空

### 设备状态汇报(0xa2)
#### 请求payload为
<table>
  <tr>
    <th>设备ID</th>
    <th>状态</th>
  </tr>
  <tr>
    <td>device_id</td>
    <th>bytes</td>
  </tr>
</table>

`状态`: bytes, 每种设备汇报的格式都不同
当前红外项目的`状态`具体定义为
<table>
  <tr>
    <th>温度</th>
    <th>保留字段</th>
  </tr>
  <tr>
    <td>short</td>
    <th>4 bytes</td>
  </tr>
</table>

### 控制返回(0xa3)
1. 学习红外(0x10)
<table>
  <tr>
    <th>控制子类型</th>
    <th>红外信号</th>
  </tr>
  <tr>
    <td>byte</td>
    <td>bytes</td>
  </tr>
</table>

### 获取设备状态返回(0xa4)
<table>
  <tr>
    <th>状态信息</th>
  </tr>
  <tr>
    <td>bytes</td>
  </tr>
</table>
每种状态都是key, value形式
<table>
  <tr>
    <th>名称(key)</th>
    <th>值(value)</th>
  </tr>
  <tr>
    <td>string</td>
    <td>depends on key</td>
  </tr>
</table>
比如如果是温度,就返回
<table>
  <tr>
    <th>名称(key)</th>
    <th>值(value)</th>
  </tr>
  <tr>
    <td>temperature</td>
    <td>30(short)</td>
  </tr>
</table>

### 控制设备(0xa5)
和手机发给服务器的一致

### 查询设备(0xa6)
和手机发给服务器的一致
