import Redis from "ioredis"; // Redis
import type { NextApiRequest, NextApiResponse } from "next";


const metadata = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name, description, imageURL, tokenAddress, tokenId } = req.body;

  if (!name || !description || !imageURL || !tokenAddress || !tokenId) {
    res.status(502).send({ error: "Missing parameters" });
  }

  const client = new Redis(process.env.REDIS_URL);
  let existingData = await client.get("metadata");
  let newData: Record<string, Record<string, string>> = {};

  if (existingData) {
    newData = JSON.parse(existingData);
  }

  newData[`${tokenAddress.toLowerCase()}-${tokenId.toString()}`] = {
    name,
    description,
    imageURL,
  };

  await client.set("metadata", JSON.stringify(newData));
  res.status(200).send({ success: true });
};

export default metadata;
