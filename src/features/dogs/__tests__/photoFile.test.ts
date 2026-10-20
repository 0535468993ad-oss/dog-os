import { assertPhotoAllowed, base64ByteLength, MAX_PHOTO_BYTES, photoFileType, PhotoRejectedError } from '../photoFile';

describe('photoFileType', () => {
  it.each([
    ['image/jpeg', 'image/jpeg', 'jpg'],
    ['image/jpg', 'image/jpeg', 'jpg'],
    [' IMAGE/PNG ', 'image/png', 'png'],
    ['image/webp', 'image/webp', 'webp'],
    ['image/heic', 'image/heic', 'heic'],
    [null, 'image/jpeg', 'jpg'],
    [undefined, 'image/jpeg', 'jpg'],
  ])('maps %p to an allowed type', (mime, contentType, ext) => {
    expect(photoFileType(mime)).toEqual({ contentType, ext });
  });

  it.each([['text/html'], ['image/svg+xml'], ['image/png/../../x'], ['constructor'], ['application/octet-stream']])('rejects %p', (mime) => {
    expect(photoFileType(mime)).toBeNull();
  });
});

describe('base64ByteLength', () => {
  it.each([['', 0], ['YQ==', 1], ['YWI=', 2], ['YWJj', 3], ['YWJj\nZGVm', 6]])('measures %p as %i bytes', (b64, bytes) => {
    expect(base64ByteLength(b64)).toBe(bytes);
  });
});

describe('assertPhotoAllowed', () => {
  it('accepts an allowed photo at the size limit', () => {
    expect(assertPhotoAllowed('image/png', MAX_PHOTO_BYTES)).toEqual({ contentType: 'image/png', ext: 'png' });
  });

  it('rejects an oversized photo', () => {
    expect(() => assertPhotoAllowed('image/png', MAX_PHOTO_BYTES + 1)).toThrow(new PhotoRejectedError('size'));
  });

  it('rejects a disallowed type before looking at size', () => {
    expect(() => assertPhotoAllowed('text/html', 10)).toThrow(PhotoRejectedError);
  });
});
