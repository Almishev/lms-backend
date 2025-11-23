/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Увеличаваме лимита за API routes (в MB)
  // Забележка: Vercel все още има ограничение от 4.5MB за request body
  // За по-големи файлове трябва да се използва streaming или presigned URLs
}

module.exports = nextConfig
