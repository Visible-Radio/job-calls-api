const { colors, readableClassification } = require('../../API/resources/config');

const makeEmailBody = (jobMatches) => {

  const header = 'Electrical Trades Job Calls Database\n\n';
  const footer = "\nBrowse historical job call data and configure your alerts at https://job-calls-front-end.herokuapp.com/"
  const htmlFooter =`
    <p style="text-align: center;">
      Browse historical job call data and configure your alerts at <a href="https://job-calls-front-end.herokuapp.com/">https://job-calls-front-end.herokuapp.com/</a>
    </p>
  `;

  const plainTextBody = jobMatches.map((jobMatch) => {
    // for each job match for a user, return plain text with the job details
    const parsedJobMatch = parseJobMatch(jobMatch);
    return generatePlainText(parsedJobMatch)  + '\n';
    // stitch the plain text together, since each job is an element in an array
  }).join('\n') + footer;

  const htmlBody = jobMatches.map(jobMatch => {
    // for each job match for a user, return an HTML card with the job details
    return htmlTemplate(jobMatch);
    // stitch the HTML together since each HTML card ends up in an array
  }).concat(htmlFooter).join('\n');

  return {htmlBody, plainTextBody}
};

const htmlTemplate = (jobMatch) => {
  const {
    union_call_id,
    call_date_from_html,
    start_date_from_html,
    company,
    members_needed,
    member_class,
    start_time,
    location,
    summary,
  } = jobMatch;

  const color = colors[member_class];

  return`
  <table width="100%" style="${cardStyle}">

    <tr style="${trStyle}">
      <td colspan="3" style="${tdStyle}">
        <h2 style="color: ${color}; border-bottom: 3px solid ${color}; margin-bottom: 4px;">${company}</h2>
      </td>
    </tr>

    <tr style="${trStyle}">
      <td colspan="3" style="${tdStyle} text-align:left;">
        <h2 style="color: ${color}; margin: 4px 0;">${readableClassification[member_class]} / ${member_class}</h2>
      </td>
    </tr>

    <tr style="${trStyle}">
      <td width="225" style="${tdStyle}">
        ${propertyField('Start Date', start_date_from_html, color)}
      </td>
      <td width="225" style="${tdStyle}">
        ${propertyField('Call Date', call_date_from_html, color)}
      </td>
    </tr>

    <tr style="${trStyle}">
      <td width="225" style="${tdStyle}">
        ${propertyField('Union Call Id', union_call_id, color)}
      </td>
      <td width="225" style="${tdStyle}">
        ${propertyField('Members Needed', members_needed, color)}
      </td>
    </tr>

    <tr style="trStyle">
      <td width="225" style="${tdStyle}">
        ${propertyField('Location', location, color)}
      </td>
      <td width="150" style="${tdStyle}">
        ${propertyField('Start Time', start_time, color)}
      </td>
    </tr>

    <tr style="trStyle">
      <td colspan="3" style="${tdStyle}">
        ${propertyField('Details', summary, color)}
      </td>
    </tr>

  </table>
  `;
}

const cardStyle = `
background-color: #001320;
border-radius: 20px;
border: 3px solid rgb(0,200,200);
color: rgb(0,200,200);
padding: 1rem;
font-size: 1rem;
margin-bottom: 1rem;
`;

const trStyle =`
vertical-align: top;
`;

const tdStyle =`
margin: 4px 4px 4px 4px;
background-color: #0c142a;
vertical-align: top;
`;

const propertyField = (property, value, color) => {
  const propertyH5 =`
  margin: 0;
  color: black;
  font-size: 1rem;
  font-weight: 400;
  text-align: center;
  background-color: ${color};
  `;

  const valueP = `
  margin: 0.5rem 1rem 1rem 1rem;
  line-height: 1.25rem;
  `;

  return `
  <h5 style="${propertyH5}">
    ${property}
  </h5>
  <p style="${valueP}">
    ${value}
  </p>
  `;
}

const generatePlainText = (parsedJobMatch) => {
   // for each key / value return a string
   return Object.entries(parsedJobMatch).map(([property, value]) => {
    return `${property.replace(/_/g,' ')}: ${value}`
  }).join('\n');
}

const parseJobMatch = (jobMatch) => {
  // pull out the properties we want
  // there are some extras we don't need to send to the user
  // rename them to something appropriate
  const {
    union_call_id: Union_Call_Id,
    call_date_from_html: Call_Date,
    start_date_from_html: Start_Date,
    company: Company,
    members_needed: Members_Needed,
    member_class: Member_Class,
    start_time: Start_Time,
    location: Location,
    summary: Details,
  } = jobMatch;

  // create a new object to loop over
  // We use the property names here as values for the email plaintext
  // The underscores get removed when the object entries are iterated over
  return {
    Union_Call_Id,
    Call_Date,
    Start_Date,
    Company,
    Members_Needed,
    Member_Class,
    Start_Time,
    Location,
    Details,
  }
}

module.exports = makeEmailBody;
