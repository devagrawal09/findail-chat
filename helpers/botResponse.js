const got = require('got');

async function generateAnswer(prompt) {
  const url = 'https://api.openai.com/v1/engines/davinci/completions';
  const params = {
    "prompt": prompt,
    "max_tokens": 150,
    "temperature": 0.9,
    "frequency_penalty": 0.5,
    "top_p": 0.1,
  };
  const headers = {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  };

  const response = await got.post(url, { json: params, headers: headers }).json();
  const output = `${prompt}${response.choices[0].text}`;
  return output;
}

module.exports = { generateAnswer };