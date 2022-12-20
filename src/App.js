import "./index.css"
import styled from "styled-components";
import { useCallback, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { uniq } from "lodash/array";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 10px solid #228a8d;
  box-sizing: border-box;
  overflow: hidden;
`

const Markered = styled.div`
  text-align: center;
  padding: 4px;
  background-color: ${ ({ color }) => color };
  color: white;
  width: ${ ({ width }) => width }px;
  z-index: 1;
`

const Title = styled(Markered)`
  margin: 20px;
  font-size: 20px;
  align-self: center;
`

const Row = styled.div`
  margin: 2rem;
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 1rem;
  justify-content: start;
  align-items: center;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
`

const CheckerColumn = styled(Column)`
  width: 200px;
`

const ExperimentsColumn = styled(Column)`
  overflow: auto;
`

const ExperimentGif = styled.img`
  max-height: 20rem;
  width: auto;
  margin-left: -50px;
`

const VerticalDivider = styled.div`
  width: 5px;
  height: 800px;
  background-color: #440356;
  margin-right: 1rem;
`

const sortExperiments = (data) => data.sort((a, b) => a.eta - b.eta)

const loadCsv = (setSimRows, setRepRows) => {
  fetch('combined_experiments.csv')
    .then(response => {
      response.text().then(csv => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: results => {
            const sims = []
            const reps = []
            results.data.forEach(row => {
              const eta = row.radical_exposure_eta
              const data = {
                experimentId: row.experiment_id,
                eta: eta === "NULL" ? null : parseFloat(eta),
              }
              if ( row.simulation_type === "SIMILARITY" ) {
                sims.push(data)
              } else if ( row.simulation_type === "REPULSIVE" ) {
                reps.push(data)
              }
            })
            setSimRows(sortExperiments(sims))
            setRepRows(sortExperiments(reps))
          },
        });
      })
    })
}

const Experiment = ({ experimentId, eta }) => {
  const title = eta === null ? 'Vanilla' : `η=${ eta }`;
  return <Column>
    <ExperimentGif src={ `figures/${ experimentId }.gif` } alt={ experimentId }
                   title={ title }/>
    <div>{ title }</div>
  </Column>;
}

const CheckboxRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-left: 16px;
  margin-top: 8px;
  justify-content: start;
  gap: 8px;
`

const Checkbox = styled.input`
  accent-color: #440356;
`

const Button = styled.div`
  width: 60px;
  border-radius: 4px;
  background-color: #228a8d;
  color: white;
  padding: 4px;
  text-align: center;
  cursor: pointer;
`

const EtaCheckbox = ({ eta, checked, onCheck }) => <CheckboxRow>
  <Checkbox type="checkbox" checked={checked} onChange={ onCheck } disabled={eta === null}/>
  <div>{ eta || 'Vanilla' }</div>
</CheckboxRow>

const App = () => {

  const [simRows, setSimRows] = useState([])
  const [repRows, setRepRows] = useState([])
  const [etas, setEtas] = useState([])
  const [selectedEtas, setSelectedEtas] = useState([])

  const filterRows = useCallback((rows) => {
    if ( selectedEtas === undefined ) {
      return rows
    }
    return rows.filter(data => data.eta === null || selectedEtas.includes(data.eta))
  }, [selectedEtas])

  const simularities = useMemo(() => filterRows(simRows), [filterRows, simRows])

  const repulsives = useMemo(() => filterRows(repRows), [filterRows, repRows])

  useEffect(() => loadCsv(setSimRows, setRepRows), [])


  useEffect(() => {
    const allEtas = uniq(simRows.map(data => data.eta));
    setEtas(allEtas)
    setSelectedEtas(allEtas)
  }, [simRows])

  return (
    <Container>
      <Title color='#228a8d' width={ 160 }>Polarization</Title>
      <Row>
        <CheckerColumn>
          <Markered width={ 200 } color="#440356">Choose η values</Markered>
          <CheckboxRow>
            <Button title="All" onClick={() => setSelectedEtas(etas)}>All</Button>
            <Button title="None" onClick={() => setSelectedEtas([null])}>None</Button>
          </CheckboxRow>
          {
            etas.map(eta => <EtaCheckbox key={ eta } eta={ eta } checked={ selectedEtas.includes(eta) } onCheck={
              () => setSelectedEtas(curr =>
                curr.includes(eta) ? curr.filter(e => e !== eta) : [...curr, eta]
              )
            }/>)
          }
        </CheckerColumn>
        <VerticalDivider/>
        <ExperimentsColumn>
          <Row>
            <Markered width={ 160 } color='#375a8c'>SIMILARITY</Markered>
            {
              simularities.map(row => <Experiment key={ row.experimentId } { ...row }/>)
            }
          </Row>
          <Row>
            <Markered width={ 160 } color='#37b877'>REPULSIVE</Markered>
            {
              repulsives.map(row => <Experiment key={ row.experimentId } { ...row }/>)
            }
          </Row>
        </ExperimentsColumn>
      </Row>
    </Container>
  );
};

export default App;
