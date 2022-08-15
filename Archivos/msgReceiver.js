exports.handler = async (event) => {
  const email = event.Records[0].body;
  console.log(`email, message & timestamps =>  ${email}`);
};
