exports.handler = async (event) => {
  const message = event.Records[0].body;
  console.log('This is the message received in the SQS => ', message);
};
