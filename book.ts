export async function fetchOriginalImage(
  bookId: string,
  pageNum: number,
): Promise<Response> {
  const url =
    `https://api.electro.nekrasovka.ru/api/books/${bookId}/pages/${pageNum}/img/original`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP status ${response.status}`);
  }
  return response;
}
