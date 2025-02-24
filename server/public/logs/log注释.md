# 3. 字段说明
Time	            请求的精确时间（ISO 格式）。
IP	                客户端 IP 地址（支持 x-forwarded-for 获取真实 IP）。
Location	        客户端 IP 的地理位置（城市和国家）。
Protocol	        请求的协议（如 HTTP/1.1 或 HTTP/2）。
Method	            请求方法（如 GET、POST）。
URL	                请求的 URL。
Query	            请求的查询参数（JSON 格式）。
Request Body	    请求体内容（JSON 格式）。
Status	            响应状态码（如 200、404）。
Response Time	    响应时间（毫秒）。
Request Size	    请求体大小（字节）。
Response Size	    响应体大小（字节）。
User-Agent	        客户端的 User-Agent 信息。
Referer	            请求的来源页面（如果有）。
Accept-Language 	客户端的语言偏好。
Host	            请求的 Host 头。
Content-Type	    响应的 Content-Type 头。

Time: 2023-10-01T12:34:56.789Z,
IP: 192.168.1.1, 
Location: Beijing, China, 
Protocol: HTTP/1.1,
Method: GET,
URL: /home,
Query: {"page": "1"},
Request Body: {},
Status: 200,
Response Time: 120ms,
Request Size: 0,
Response Size: 1024,
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36,
Referer: https://example.com,
Accept-Language: en-US,en;q=0.9,
Host: example.com,
Content-Type: text/html