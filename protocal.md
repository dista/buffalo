# phone to server
----------------------------
* heartbeat
format: 
  start_code: 0x97 
  type: 0x10
  packet_id: 4 bytes
  len: 2 bytes
  session_id: 8 bytes
  verify_byte: 1 byte
  end_byte: 0x99
