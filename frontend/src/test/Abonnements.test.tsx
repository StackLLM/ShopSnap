import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Abonnements } from "@/components/app/Abonnements";

const data = {
  categories: ["Vêtements et chaussures", "Vêtements", "Autre"],
  comptes: [
    { username: "demo_shoes", nom: "Demo Shoes", verifie: false, categorie: "Vêtements et chaussures", mot: "shoes", lien: "https://www.instagram.com/demo_shoes/" },
    { username: "demo_clothes", nom: "Demo Clothes", verifie: true, categorie: "Vêtements", mot: "clothes", lien: "https://www.instagram.com/demo_clothes/" },
    { username: "ami", nom: "Un ami", verifie: false, categorie: "Autre", mot: "", lien: "https://www.instagram.com/ami/" },
  ],
};

function Banc() {
  const [profil, setProfil] = useState("");
  return (
    <>
      <Abonnements data={data} profil={profil} setProfil={setProfil} versProfil={() => {}} />
      <output data-testid="champ">{profil}</output>
    </>
  );
}

describe("Mes abonnements", () => {
  it("affiche les catégories avec leur nombre", () => {
    render(<Banc />);
    expect(screen.getByText("Tous", { exact: false })).toHaveTextContent("Tous (3)");
    expect(screen.getByRole("button", { name: /Vêtements \(1\)/ })).toBeInTheDocument();
  });

  it("cocher remplit le champ Profil, tout décocher le vide", () => {
    render(<Banc />);
    fireEvent.click(screen.getByLabelText("Cocher @demo_shoes"));
    expect(screen.getByTestId("champ")).toHaveTextContent("https://www.instagram.com/demo_shoes/");
    expect(screen.getByText("1 coché")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Tout décocher"));
    expect(screen.getByTestId("champ")).toHaveTextContent("");
  });

  it("cocher la liste affichée prend tout l'onglet en cours", () => {
    render(<Banc />);
    fireEvent.click(screen.getByRole("button", { name: /^Tous/ }));
    fireEvent.click(screen.getByText("Cocher la liste affichée"));
    expect(screen.getByText("3 cochés")).toBeInTheDocument();
  });

  it("la recherche filtre par nom", () => {
    render(<Banc />);
    fireEvent.click(screen.getByRole("button", { name: /^Tous/ }));
    fireEvent.change(screen.getByPlaceholderText("Rechercher un nom…"), { target: { value: "clothes" } });
    expect(screen.queryByLabelText("Cocher @ami")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Cocher @demo_clothes")).toBeInTheDocument();
  });
});
