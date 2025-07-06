# Test field name auto-completion
# First add some json fields, then try adding @openapi comments

json.success true
json.error_message "Something went wrong"
json.user_id 123
json.created_at Time.current
json.data @response_data

# Now type "# @openapi " (with space) and press Ctrl+Space
# You should see: success, error_message, user_id, created_at, data as completion options

# Try it here:
# @openapi 

# Each completion will give you the field name with type selector:
# @openapi success:boolean
# @openapi error_message:string
# etc.