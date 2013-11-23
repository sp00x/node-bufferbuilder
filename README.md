# BufferBuilder (node-bufferbuilder)

Node.js library for building buffers, and doing various range manipulations

## Usage

TBD.

## API

Positive offsets = relative to the start. Negative offsets = relative to end. 

### Constructor

#### new BufferBuilder()

### Methods

#### clear()

#### appendBuffers(buf1, buf2, buf3, .., bufN)

#### appendBuffer(buffer, [offset = 0], [length = buffer.length])

#### build() : buffer

#### buildRange(offset, length) : buffer

#### removeRange(offset, length)

#### pack

Replaces the internal, fragmented buffers with the result of buildBuffer() 

### Properties

#### length

## Requirements

* Node.js

## License

TBD.