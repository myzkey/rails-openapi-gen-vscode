# @openapi id:integer required:true description:"User ID"
json.id @user.id

# @openapi status:string required:true description:"User status"  
json.status @user.status

# @openapi email:string description:"Email address"
json.email @user.email

# Valid minimal format (type only)
# @openapi name:string
json.name @user.name

# Missing type attribute (this should show warning)
# @openapi required:true description:"Some field"
json.field @user.field

# Completely missing @openapi comment
json.created_at @user.created_at

# JBuilder array method (should not require @openapi comment)
json.array @users do |user|
  # @openapi user_id:integer required:true description:"User ID in array"
  json.user_id user.id
  json.user_name user.name  # This should show error
end

# Other JBuilder methods that should be ignored
json.set! :dynamic_field, @value
json.merge! additional_data

# Nested object (should not require @openapi comment)
json.user do
  # @openapi id:integer required:true description:"User ID"
  json.id @user.id
  
  # @openapi email:string required:true description:"User email"
  json.email @user.email
  
  json.name @user.name  # This should show error
end

# Nested with if condition (should also be ignored)
json.data do
  json.items @items if @items.present?
end

# Array iteration (should not require @openapi comment for 'tags')
json.tags @post[:tags] do |tag|
  # @openapi name:string required:true description:"Tag name"
  json.name tag[:name]
  # @openapi color:string required:true description:"Tag color in hex format"
  json.color tag[:color]
  json.description tag[:description]  # This should show error
end

# More block examples that should be ignored
json.comments @comments.each do |comment|
  json.text comment.text
end

json.users @users do |user|
  json.id user.id
end