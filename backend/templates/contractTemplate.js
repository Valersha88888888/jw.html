function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatSwedishDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildContractHtml(contract) {
  const customerName = [
    contract.customer_first_name,
    contract.customer_last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const customerAddress = [
    contract.customer_address,
    contract.customer_postal_code,
    contract.customer_city,
  ]
    .filter(Boolean)
    .join(", ");

  const serviceAddress = [
    contract.service_address,
    contract.service_postal_code,
    contract.service_city,
  ]
    .filter(Boolean)
    .join(", ");

  return `
        <article class="legal-contract">

            <section class="contract-party-grid">
                <div>
                    <h2>Kunduppgifter</h2>

                    <dl>
                        <dt>Namn</dt>
                        <dd>${escapeHtml(customerName)}</dd>

                        <dt>Personnummer</dt>
                        <dd>${escapeHtml(contract.customer_personnummer || "-")}</dd>

                        <dt>Telefon</dt>
                        <dd>${escapeHtml(contract.customer_phone || "-")}</dd>

                        <dt>E-post</dt>
                        <dd>${escapeHtml(contract.customer_email)}</dd>

                        <dt>Adress</dt>
                        <dd>${escapeHtml(customerAddress || "-")}</dd>
                    </dl>
                </div>

                <div>
                    <h2>Städtjänst</h2>

                    <dl>
                        <dt>Tjänst</dt>
                        <dd>Återkommande hemstädning</dd>

                        <dt>Städadress</dt>
                        <dd>${escapeHtml(serviceAddress)}</dd>

                        <dt>Bostadens storlek</dt>
                        <dd>${escapeHtml(contract.service_area_m2 || "-")} m²</dd>

                        <dt>Frekvens</dt>
                        <dd>${escapeHtml(contract.service_frequency || "-")}</dd>

                        <dt>Beräknad städtid</dt>
                        <dd>${escapeHtml(contract.service_hours || "-")} timmar</dd>

                        <dt>Veckodag</dt>
                        <dd>${escapeHtml(contract.service_day || "-")}</dd>

                        <dt>Starttid</dt>
                        <dd>${escapeHtml(contract.service_time || "-")}</dd>

                        <dt>Startdatum</dt>
                        <dd>${escapeHtml(
                          formatSwedishDate(contract.start_date),
                        )}</dd>
                    </dl>
                </div>
            </section>

            <section>
                <h2>1. Pris och introduktionserbjudande</h2>

                <p>
                    Kunden har accepterat ett introduktionserbjudande från
                    <strong>J&W Quality Hemservice</strong>.
                </p>

                <p>
                    För Kundens första <strong>tre (3) ordinarie städtillfällen</strong>
                    gäller ett pris om
                    <strong>149 kronor per timme efter preliminärt RUT-avdrag</strong>.
                </p>

                <p>
                    Från och med Kundens <strong>fjärde ordinarie städtillfälle</strong>
                    gäller det ordinarie priset
                    <strong>250 kronor per timme efter preliminärt RUT-avdrag</strong>.
                </p>

                <p>
                    Introduktionspriset innebär inte att avtalet avslutas efter
                    de tre första städtillfällena.
                </p>
            </section>

            <section>
                <h2>2. RUT-avdrag</h2>

                <p>
                    Priser efter RUT-avdrag förutsätter att Kunden uppfyller
                    Skatteverkets villkor för skattereduktionen.
                </p>

                <p>
                    Kunden ansvarar för att lämnade personuppgifter är korrekta
                    och att Kunden har tillräckligt skatteutrymme.
                </p>

                <p>
                    Om Skatteverket helt eller delvis avslår RUT-avdraget har
                    J&W Quality Hemservice rätt att fakturera Kunden motsvarande
                    återstående belopp.
                </p>
            </section>

            <section>
                <h2>3. Bindningstid</h2>

                <p>
                    Avtalet har en inledande bindningstid om
                    <strong>tolv (12) månader</strong> från avtalets startdatum.
                </p>

                <p>
                    Kunden bekräftar att introduktionserbjudandet är kopplat
                    till detta avtal om återkommande hemstädning.
                </p>

                <p>
                    Kundens rättigheter enligt tvingande svensk
                    konsumentlagstiftning påverkas inte.
                </p>
            </section>

            <section>
                <h2>4. Efter bindningstidens slut</h2>

                <p>
                    Efter de första 12 månaderna övergår avtalet till ett
                    tillsvidareavtal med
                    <strong>30 dagars uppsägningstid</strong>.
                </p>
            </section>

            <section>
                <h2>5. Ombokning och avbokning</h2>

                <p>
                    Kunden kan kostnadsfritt begära ombokning eller avbokning
                    om J&W Quality Hemservice meddelas senast
                    <strong>24 timmar före bokad starttid</strong>.
                </p>

                <p>
                    Vid sjukdom eller annan oförutsedd händelse ska Kunden
                    kontakta J&W Quality Hemservice så snart som möjligt.
                </p>
            </section>

            <section>
                <h2>6. Sen avbokning</h2>

                <p>
                    Vid avbokning senare än 24 timmar före bokad starttid kan
                    J&W Quality Hemservice ta ut skälig ersättning i den
                    omfattning som följer av avtalet och tillämplig svensk lag.
                </p>

                <p>
                    Avbokning av ett enskilt städtillfälle innebär inte att
                    huvudavtalet automatiskt avslutas.
                </p>
            </section>

            <section>
                <h2>7. Tillträde till bostaden</h2>

                <p>
                    Kunden ansvarar för att J&W Quality Hemservice får tillträde
                    till bostaden vid överenskommen tid.
                </p>

                <p>
                    Om tillträde inte kan ske på grund av exempelvis felaktig
                    portkod, saknad nyckel, låst dörr eller aktiverat larm kan
                    detta behandlas enligt reglerna för sen avbokning.
                </p>
            </section>

            <section>
                <h2>8. Städutrustning och material</h2>

                <p>
                    Om inget annat särskilt har avtalats använder
                    J&W Quality Hemservice Kundens städutrustning och
                    städmaterial.
                </p>

                <p>
                    Kunden ansvarar för att lämplig och fungerande utrustning
                    finns tillgänglig.
                </p>
            </section>

            <section>
                <h2>9. Personal och arbetsmiljö</h2>

                <p>
                    J&W Quality Hemservice bestämmer vilken lämplig personal som
                    utför tjänsten och kan vid behov ersätta ordinarie personal.
                </p>

                <p>
                    Kunden ansvarar för att bostaden erbjuder en rimligt säker
                    arbetsmiljö och ska informera om husdjur eller andra
                    omständigheter som påverkar arbetet.
                </p>
            </section>

            <section>
                <h2>10. Utförande och reklamation</h2>

                <p>
                    J&W Quality Hemservice ska utföra tjänsten professionellt
                    och omsorgsfullt enligt vad som har avtalats.
                </p>

                <p>
                    Om Kunden anser att tjänsten är bristfällig ska
                    J&W Quality Hemservice kontaktas så snart som möjligt och
                    ges skälig möjlighet att undersöka och vid behov åtgärda
                    konstaterade brister.
                </p>
            </section>

            <section>
                <h2>11. Skador och ansvar</h2>

                <p>
                    Skador som Kunden anser har uppstått i samband med
                    städningen ska meddelas J&W Quality Hemservice så snart som
                    möjligt.
                </p>

                <p>
                    J&W Quality Hemservice ansvarar för skador i den omfattning
                    som följer av svensk lag och ska ha relevant
                    ansvarsförsäkring för verksamheten.
                </p>
            </section>

            <section>
                <h2>12. Fakturering och betalning</h2>

                <p>
                    Fakturering sker normalt månadsvis om inget annat har
                    avtalats.
                </p>

                <p>
                    Vid försenad betalning kan J&W Quality Hemservice ta ut
                    dröjsmålsränta och tillåtna påminnelse- och inkassoavgifter
                    enligt gällande regler.
                </p>
            </section>

            <section>
                <h2>13. Prisändring</h2>

                <p>
                    Under den inledande bindningstiden gäller den prisstruktur
                    som Kunden har accepterat.
                </p>

                <p>
                    Efter bindningstidens slut får J&W Quality Hemservice ändra
                    ordinarie pris efter att Kunden informerats i skälig tid.
                </p>
            </section>

            <section>
                <h2>14. Ångerrätt vid distansavtal</h2>

                <p>
                    Om avtalet ingås på distans har Kunden som huvudregel
                    14 dagars ångerrätt enligt svensk lag.
                </p>

                <p>
                    Den lagstadgade ångerrätten gäller oberoende av avtalets
                    bindningstid.
                </p>
            </section>

            <section>
                <h2>15. Personuppgifter och sekretess</h2>

                <p>
                    J&W Quality Hemservice behandlar Kundens personuppgifter för
                    administration av avtalet, planering, fakturering,
                    RUT-avdrag, kommunikation, elektronisk signering och
                    rättsliga skyldigheter.
                </p>

                <p>
                    Uppgifter om bostad, nycklar och koder ska hanteras med
                    lämplig sekretess.
                </p>
            </section>

            <section>
                <h2>16. Elektronisk kommunikation</h2>

                <p>
                    Kunden accepterar att avtalsrelaterad information,
                    påminnelser, fakturor och signerade dokument kan skickas
                    via e-post och/eller SMS.
                </p>
            </section>

            <section>
                <h2>17. Elektronisk signering med BankID</h2>

                <p>
                    Innan signeringen ska Kunden ha möjlighet att läsa hela
                    detta avtal.
                </p>

                <p>
                    Genom BankID-signeringen bekräftar Kunden sin identitet och
                    att Kunden har tagit del av och accepterat avtalsvillkoren.
                </p>

                <p>
                    Efter signeringen ska Kunden få en kopia av det signerade
                    avtalet på ett varaktigt medium, exempelvis PDF via e-post.
                </p>
            </section>

            <section>
                <h2>18. Tillämplig lag och tvist</h2>

                <p>
                    Svensk lag gäller för avtalet.
                </p>

                <p>
                    Parterna ska i första hand försöka lösa en eventuell tvist
                    genom dialog. Kunden kan, när förutsättningarna är
                    uppfyllda, få en konsumenttvist prövad av
                    Allmänna reklamationsnämnden (ARN).
                </p>
            </section>

            <section class="company-approval">
                <h2>J&W Quality Hemservices godkännande</h2>

                <p>
                    ✓ Detta avtal är utfärdat och digitalt förhandsgodkänt av
                    <strong>J&W Quality Hemservice</strong>.
                </p>
            </section>

        </article>
    `;
}

module.exports = {
  buildContractHtml,
};
