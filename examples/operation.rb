# Example of OpenAPI operation documentation in Ruby

class PostsController < ApplicationController
  =begin
    @openapi_operation
      summary:"Create new post"
      tags:[Posts,Write,API]
      description:"Create a new blog post with validation"
      response_description:"Created post with ID and status"
      parameters:"title, content, author_id"
      requestBody:"Post creation data"
  =end
  def create
    # Implementation
  end

  =begin
    @openapi_operation
      summary:"Get all posts"
      tags:[Posts,Read,Public]
      description:"Retrieve a list of all blog posts"
      response_description:"Array of post objects"
      parameters:"page, limit, sort_by"
  =end
  def index
    # Implementation
  end

  =begin
    @openapi_operation
      summary:"Update post"
      tags:[Posts,Write]
      description:"Update an existing blog post"
      response_description:"Updated post data"
  =end
  def update
    # Implementation
  end
end

# Inline comment style still works
# @openapi id:integer required:true description:"Post ID"