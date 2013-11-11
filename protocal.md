# notation
* p-s: message sent from phone to server
* s-d: message sent from server to device


# 1. heartbeat(p-s)

    request:  18 bytes                                  response:  12 bytes
    
    start_code: 0x97            -- 0                    start_code: 0x97       -- 0
    type: 0x10                  -- 1                    type: 0x10             -- 1
    packet_id: 4 bytes          -- 2                    packet_id: 4 bytes     -- 2
    len: 2 bytes                -- 6                    len: 2 bytes           -- 6
    session_id: 8 bytes         -- 8                    result: 1 byte         -- 8
    verify_byte: 1 byte         -- 16                   error_code: 1 byte     -- 9
    end_byte: 0x99              -- 17                   verify_byte: 1 byte    -- 10
                                                        end_byte: 0x99         -- 11
                                                   
# 2. login(p-s)

    request:  18 bytes                                  response:  12 bytes
    
    start_code: 0x97                                    start_code: 0x97 
    type: 0x11                                          type: 0x11 
    packet_id: 4 bytes                                  packet_id: 4 bytes 
    len: 2 bytes                                        len: 2 bytes 
    username/email: variable bytes                      result: 1 byte 
    sep: '/'                                            session_id/error_code: 8 bytes
    password: variable bytes                             
    end_char: 0x27
    verify_byte: 1 byte                                 
    end_byte: 0x99                                      verify_byte: 1 byte 
                                                        end_byte: 0x99 

