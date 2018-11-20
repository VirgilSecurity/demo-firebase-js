export function base64UrlFromBase64 (input: string) {
	input = input.split('=')[0];
	input = input.replace(/\+/g, '-').replace(/\//g, '_');
	return input;
}
