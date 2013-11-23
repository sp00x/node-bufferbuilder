var
	ClassUtil = require('./class-util');

function BufferBuilder(copy)
{
	this.copy = (copy !== false);
	this.buffers = [];
	this.length = 0;

	ClassUtil.bindFunctions(this); // bind all __blah() as blah() to /this/
}

BufferBuilder.prototype.__clear = function()
{
	this.buffers = [];
	this.length = 0;
}

BufferBuilder.prototype.__appendBuffers = function()
{
	for (var i=0; arguments.length>i; i++)
	{
		this.appendBuffer(arguments[i]);
	}
}

BufferBuilder.prototype.__appendBuffer = function(buf, offset, length)
{
	offset = offset || 0;
	length = length || buf.length;

	//console.log("buf=%s, offset=%s, length=%s", buf, offset, buf.length);

	if (this.copy || length != buf.length || offset != 0)
	{
		if (this.copy)
		{
			// copy the range (or the entire buffer) to a new buffer
			var buf2 = new Buffer(length);
			buf.copy(buf2, 0, offset, offset + length);
			buf = buf2;
		}
		else
		{
			// memory copy of the range
			buf = buf.slice(offset, offset + length);
		}
	}
	this.buffers.push(buf);
	this.length += buf.length;
}

BufferBuilder.prototype.__build = function()
{
	var buf = new Buffer(this.length);
	var pos = 0;
	for (var i=0; this.buffers.length>i; i++)
	{
		var b = this.buffers[i];
		b.copy(buf, pos);
		pos += b.length;
	}
	return buf;
}

BufferBuilder.prototype.__buildRange = function(offset, length)
{
	offset = offset || 0;
	if (offset < 0) offset = this.length + offset;
	length = length || this.length - offset;

	var buffer = new Buffer(length);
	var new_pos = 0;

	var pos = 0;
	var i = 0;

	while (this.buffers.length > i && length > 0)
	{
		var b = this.buffers[i];
		//console.log("-buffer %s: ", i, b);

		// is the start offset in this buffer?
		if (offset >= pos && offset < (pos + b.length))
		{
			//console.log("-our range");

			var our_max = (pos + b.length) - offset;
			var our_start = offset; // our first possible offset within the range
			var our_end = our_start + our_max; // our last possible offset within the range

			// get how many bytes we will be able to process
			var our_length = length > our_max ? our_max : length;
			//console.log("-max, start, end, len = %s, %s, %s, %s", our_max, our_start, our_end, our_length);

			// copy it into the new buffer
			b.copy(buffer, new_pos, our_start - pos, our_start - pos + our_length);
			new_pos += our_length;

			// continue
			offset += our_length;
			length -= our_length;
		}

		// next
		pos += b.length;
		i++;
	}

	return buffer;
}

BufferBuilder.prototype.__removeRange = function(offset, length)
{
	offset = offset || 0;
	if (offset < 0) offset = this.length + offset;
	length = length || this.length - offset;

	var pos = 0;
	var i = 0;
	var new_buffers = [];
	var new_length = 0;

	while (this.buffers.length > i)
	{
		var b = this.buffers[i];
		//console.log("-buffer %s: ", i, b);

		var new_pos = pos + b.length;

		// is the start offset in this buffer?
		if (length > 0 && offset >= pos && offset < (pos + b.length))
		{
			//console.log("-our range");

			var our_max = (pos + b.length) - offset;

			var our_start = offset; // our first possible offset within the range

			// get how many bytes we will be able to process
			var our_length = length > our_max ? our_max : length;
			var our_end = our_start + our_length; // our last possible offset within the range

			//console.log("-max, start, end, len = %s, %s, %s, %s", our_max, our_start, our_end, our_length);

			// calc pre/post remainders
			var pre_length = our_start - pos; // if ==0 -> exact start of this buffer, otherwise -> remainder
			var post_length = pos + b.length - our_end; // if <=0 -> to the end our this buffer, if >0 -> remainder

			//console.log("-pre/post = ", pre_length, " / ", post_length);

			if (pre_length > 0)
			{
				//console.log("-pre = ", pre_length);

				var pre;
				if (this.copy)
				{
					pre = new Buffer(pre_length);
					b.copy(pre, 0, 0, pre_length);
				}
				else
					pre = b.slice(0, pre_length);

				new_buffers.push(pre);
				new_length += pre_length;
			}

			if (post_length > 0)
			{
				//console.log("-post = ", post_length);
				var
					post,
					start = our_start + our_length - pos,
					end = our_start + our_length + post_length - pos;

				if (this.copy)
				{
					var post = new Buffer(post_length);				
					b.copy(post, 0, start, end);
				}
				else
					post = b.slice(start, end);

				new_buffers.push(post);
				new_length += post_length;
			}

			// continue
			offset += our_length;
			length -= our_length;
		}
		else
		{
			new_length += b.length;
			new_buffers.push(b);
		}

		// next
		pos = new_pos;
		i++;
	}

	this.buffers = new_buffers;
	this.length = new_length;
}

BufferBuilder.prototype.__pack = function()
{
	var b = this.buildBuffer();
	this.buffers = [ b ];
}

module.exports = BufferBuilder;