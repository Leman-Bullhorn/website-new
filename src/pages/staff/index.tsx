import Head from "next/head";
import NavigationBar from "../../components/navigationBar";

const SectionTitle = ({ children }: { children: string }) => (
  <p className="font-headline text-lg font-semibold">{children}</p>
);

export default function StaffPage() {
  return (
    <>
      <Head>
        <title>The Bullhorn Staff</title>
      </Head>
      <NavigationBar />
      <div className="container mx-auto">
        <h1 className="mt-4 text-center font-headline text-2xl font-medium">
          Staff
        </h1>

        <h3 className="mt-2 mb-4 text-center font-headline text-xl">
          Members of the 2022-23 Bullhorn team
        </h3>

        <div className="grid  grid-cols-5 items-start gap-y-4 text-center">
          <div className="col-start-1">
            <SectionTitle>Managing Editor</SectionTitle>
            <p>Danae Kosta</p>
          </div>
          <div className="col-start-3">
            <SectionTitle>Content Engineer</SectionTitle>
            <p>Max Glass</p>
          </div>
          <div className="col-start-5">
            <SectionTitle>Managing Arts Director</SectionTitle>
            <p>Colin Grant</p>
          </div>
          <div className="col-start-1">
            <SectionTitle>News</SectionTitle>
            <p>Brandon Curo</p>
            <p>Zander Sargeant</p>
            <p>Ember Pires</p>
            <p>Didem Harris</p>
            <p>Blair Walsh</p>
            <p>Renata Bellizia Glori</p>
            <p>Sofia Doucette</p>
            <p>Lizzi Volpert</p>
          </div>
          <div className="col-start-3">
            <SectionTitle>Opinions</SectionTitle>
            <p>Tabbie Brovner</p>
            <p>Caelyn Osbern</p>
            <p>Sofia Anna Zullo</p>
            <p>Charli Reda</p>
            <p>Kareem McLeod</p>
          </div>
          <div className="col-start-5">
            <SectionTitle>Features</SectionTitle>
            <p>Sara Sajjad</p>
            <p>Lina Ytuarte</p>
            <p>Lev Feldsher</p>
          </div>
          <div className="col-start-1">
            <SectionTitle>Science</SectionTitle>
            <p>Saahil Suri</p>
            <p>Jasper Dratt</p>
            <p>Quinn Peacock</p>
            <p>Joseph Pazmino Larco</p>
          </div>
          <div className="col-start-3">
            <SectionTitle>Sports</SectionTitle>
            <p>Jotham Kriakos</p>
            <p>Lucas Forwood</p>
            <p>Paloma Alonso</p>
            <p>Samir Saleh</p>
            <p>Julian Burdess</p>
            <p>Eliana Friedman</p>
          </div>
          <div className="col-start-5">
            <SectionTitle>Arts & Entertainment</SectionTitle>
            <p>Ruby McGrath</p>
            <p>Victoria Cornet</p>
            <p>Flavia Mezzari</p>
            <p>Fernanda Sieber</p>
            <p>Sade Modeste</p>
            <p>Genevieve Shibilo</p>
            <p>Maya Beshir-Renard</p>
            <p>Seraphima Wolfson</p>
          </div>
          <div className="col-start-2">
            <SectionTitle>Photography</SectionTitle>
            <p>Lili Sposato</p>
            <p>Lucas Paulino</p>
          </div>
          <div className="col-start-4">
            <SectionTitle>Art & Design</SectionTitle>
            <p>Charles Longsworth</p>
            <p>Samia Perez</p>
            <p>Maya Jess</p>
            <p>Camila Passos</p>
            <p>River An</p>
            <p>Mark Shanker</p>
          </div>
        </div>
      </div>
    </>
  );
}
