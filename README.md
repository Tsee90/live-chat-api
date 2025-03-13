Final assignment for The Odin Project
Coded by Theo See

This is an API for a live chat app. See it in action at chizmiz.live,

DOCUMENTATION

This application using Node.js with a posgreSQL database mapped with Prisma. Express routes can be used to call all methods and socket.io is used to call methods required for live chatting.

USER ROUTES

All user routes are called as (baseurl/users). They are used to create and manipulate User objects in the database. User objects consist of

{
id String @id @default(cuid())  
 username String @unique
email String @unique
password String
banned Boolean @default(false)
role String @default("user")  
 croom Room[]
messages Message[]
roomId String?  
 room Room? @relation("UserRoom", fields: [roomId], references: [id])
emailVerified Boolean @default(false)
verificationCode String?
}

All keys are pretty self explanatory save for 'croom' which stands for created room. Not sure why I named it that but so it is. Currently banned is not used for any of the methods, but can be used for in the future to keep track of banned users.

Note that there is no consistency in errors as I was trying out different things. Will need to refactor to make more useful.

All methods can be found in userControllers.js.

POST

/signup -- this calls the createUser method. Requires body to include username, email, and password. A verification code will be sent to the user which can be verified using the /verify-email route. Returns status 200 {username, email} json on success and status 400 error on failure.

/login -- this calls login method. Requires body to include username and password. Passport-local is used to authenticate data and passport-jwt will create a token. Returns status 200 {token, user} json on success and status 401 error on failure.

/verify-email -- this calls the verifyEmail method. Requires body to include email and code. Returns status 200 {message} on success and status 500 error on failure.

/create-admin -- this calls createUserByAdmin method. Requires body to include username, email, and password. This was used to bypass authentication checks to easily create users for testing. Not recommended to keep in production. Commented out.

GET

For all get routes id refers to id key in User.

/ -- this calls getAllUsers method. Returns list of all Users in database. Originally used for testing, I did not need this in my project so it is commented out.

/:id --this calls the getUserById method. Requires params to include id. Returns user object if found else returns status 400 error.

PUT

/:id -- this calls the updateUser method. Requires params to include id and body to include any User key/value that will be changed (ex. {email: example@gmail.com}). Returns updated user object on success.

DELETE

/:id -- this calls the deleteUser method. Requires params to include id. Deletes the user with associated id. Returns {message} if successful else status 400 error. Not yet implemented in my front end so it is commented out.

ROOM ROUTES

All room routes are called using (baseurl/rooms). They are used to create and manipulate Room objects in the database. Room objects consist of

{
id String @id @default(cuid())
name String
userId String  
 startsAt DateTime @default(now())  
 expiresAt DateTime
active Boolean @default(false)

messages Message[]
creator User @relation(fields: [userId], references: [id])

location Unsupported("geometry(Point, 4326)")
users User[] @relation("UserRoom")
}

These are the individual chat rooms that store message and user data. Again, the errors that are thrown remains inconsistent which is something I should definitely fix.

All methods can be found in roomController.js.

All methods require a valid jwt token sent via headers as Authorization: Bearer <token>. User id is gathered from the token via req.user.id.

Note that for certain routes it is better to use the socket.io method for live chatting. These will be marked with \*\*\* to indicate their is a duplicate socket method.

POST

/ -- calls the createRoom method. Requires body to include
{
location: {latitude, longitude},
startsAt,
expiresAt,
name,
}
This creates a new room object. Returns status 201 along with room object on success and status 400 error on failure.

/:roomId/join -- calls the joinRoom method. Requires params to include roomId. Adds a user to a room object. Returns status 200 along with room object on success and status 400 error on failure. \*\*\*

/:roomId/leave -- calls the leaveRoom method. Requires params to include roomId. Removes user from room object. Returns status 200 with {message} on success and status 400 error on failure. \*\*\*

GET

/ -- calls the getRooms method. Requires query to include sort and radiusKm. sort must be a string with a value of either 'userCount' or 'newest'. Other sort methods could be added. Returns a sorted list of all rooms within a certain kilometer radius.

/:roomId -- calls the getRoomById method. Requires params to include roomId. Returns room object on success and status 400 error on failure.

PUT

/:roomId -- calls the updateRoom method. Requires params to include roomId and body to include any room key/value pairs that will change. Returns updated room object on success and status 400 error on failure. I did not implement this method in my frontend so it is commented out.

DELETE

/:roomId -- calls the deleteRoom method. Requires params to include roomId. Deletes room object from db. Returns {message} on success and status 400 error on failure. I did not implement a delete feature on my frontend instead persisting rooms indefinitely and only activating and deactivating them as needed. Commented out.

MESSAGE ROUTES

All message routes are called as (baseurl/rooms/:roomId/messages). They are used to create and manipulate message objects. Message objects consist of:
{
id String @id @default(cuid())  
 content String
createdAt DateTime @default(now())

senderId String  
 sender User @relation(fields: [senderId], references: [id])

roomId String  
 room Room @relation(fields: [roomId], references: [id])
}

All methods require a valid jwt token sent via headers as Authorization: Bearer <token>. User id is gathered from the token via req.user.id.

It is recommended that you use the socket.io methods instead of these express routes for live chatting. I did not end up using any of these methods in production although they could come in handy for something like an admin account which could want to see past messages.

POST

/ -- calls createMessage method. Requires params to include roomId and body to include content. Creates a new message object. Returns status 201 along with message object on success. Returns status 400 error on failure.

GET

/ -- calls getMessagesByRoom method. Requires params to include roomId. Returns messages array on success and status 400 error on failure.

/:messageId -- calls getMessageById method. Requires params and messageId. Returns message object on success and status 400 error on failure.

DELETE

/:messageId -- calls the deleteMessage method. Requires params to include messageId. Deletes the message with associated id. Returns {message} on success and status 400 error on failure. Commented out as it is not used in my production.

SOCKETS

socket.io is used to create a open connection with the API to handle live chatting. See their website on how to connect frontend with backend API. Below are the methods called using socket.on('method_name', function). I will only be listing the method names. See chatSocket.js for the code.

'connection' -- Requires socket. Adds user to activeUsers list. If user is already in activeUsers list, it will emit 'force_logout' before adding activeUser.

'join_room' -- Requires {roomId}. Adds user to a room. Emits 'joined_room' and {user} on success. Emits 'error' on failure.

'send_message' -- Requires {message, createdAt}. Creates a new message in database. Emits 'receive_message' and {messages} on success. Emits 'error' on failure.

'leave_room' -- No requirements. Removes user from room. Emits 'user_left' and {userId} on success. Emits 'error' on failure.

'disconnect' --No requirements. Removes user from activeUsers list and also removes user from room if they are in one. Emits 'user_left' and {userId} on success. Emits 'error' on failure.
