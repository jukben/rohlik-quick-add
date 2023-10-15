export default async function handler(request, response) {
  const { ean = null } = request.query;
  if (!ean) {
    return response.status(400).send("Missing ean");
  }

  try {
    const ferPotravinaProduct = await (
      await fetch(`https://api.ferpotravina.cz/products?page=1&query=${ean}`)
    ).json();

    const name = ferPotravinaProduct.products[0].name;

    const rohlikProduct = await (
      await fetch(
        `https://www.rohlik.cz/services/frontend-service/autocomplete?search=${name.replace(
          / /g,
          "%20"
        )}&referer=whisperer&companyId=1`
      )
    ).json();

    const closestRohlikProduct = rohlikProduct.productIds[0];

    const price = await (
      await fetch(
        `https://www.rohlik.cz/api/v1/products/prices?products=${closestRohlikProduct}`
      )
    ).json();

    const rohlikPrice = price[0].price;

    return response.send({ name, rohlikPrice });
  } catch (error) {
    return response.status(500).send("Error");
  }
}
